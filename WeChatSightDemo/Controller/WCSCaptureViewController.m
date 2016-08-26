//
//  WCSCaptureViewController.m
//  WeChatSightDemo
//
//  Created by 吴珂 on 16/8/19.
//  Copyright © 2016年 吴珂. All rights reserved.
//

#import "WCSCaptureViewController.h"
#import "WKMovieRecorder.h"
#import "WKScaleButton.h"
#import "WCSPreviewViewController.h"

#define kScreenHeight [UIScreen mainScreen].bounds.size.height
#define kScreenWidth [UIScreen mainScreen].bounds.size.width

const NSTimeInterval MinDuration = 3.f;
const CGFloat ProgressLayerHeigth = 2.f;
const NSInteger CaptureScaleFactor = 2.f;
static void * DurationContext = &DurationContext;

@interface WCSCaptureViewController ()

//StoryBoard
@property (weak, nonatomic) IBOutlet UIView *preview;
@property (weak, nonatomic) IBOutlet UIImageView *focusImageView;
@property (weak, nonatomic) IBOutlet UILabel *statusLabel;
@property (weak, nonatomic) IBOutlet WKScaleButton *longPressButton;
//indicator
@property (nonatomic, strong) CALayer *processLayer;

@property (nonatomic, assign, getter=isScale) BOOL scale;

@property (nonatomic, strong) WKMovieRecorder *recorder;



@end

@implementation WCSCaptureViewController

#pragma mark - LifeCycle

- (void)viewDidLoad {
    [super viewDidLoad];
 
    [self setupUI];
    
    [self setupRecorder];
    
}

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
    
    [self.navigationController setNavigationBarHidden:YES animated:YES];
    
    [_recorder startSession];
}

- (void)viewWillDisappear:(BOOL)animated
{
    [super viewWillDisappear:animated];
    [self.navigationController setNavigationBarHidden:NO animated:YES];
    [self.recorder finishCapture];
}


- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    
}

- (void)setupUI
{
    _statusLabel.text = @"上移取消";
    _statusLabel.textColor = [UIColor greenColor];
}

#pragma mark - setupRecorder
- (void)setupRecorder
{
    _recorder = [[WKMovieRecorder alloc] initWithMaxDuration:10.f];
    
    CGFloat width = 320.f;
    CGFloat Height = width / 4 * 3;
    _recorder.cropSize = CGSizeMake(width, Height);
    __weak typeof(self)weakSelf = self;
    
    [_recorder setAuthorizationResultBlock:^(BOOL success){
        if (!success) {
            dispatch_async(dispatch_get_main_queue(), ^{
                
                NSLog(@"这里就省略没有权限的处理了");
            });
        }
    }];
    
    [_recorder prepareCaptureWithBlock:^{
        
        //1.video preview
        AVCaptureVideoPreviewLayer* preview = [_recorder getPreviewLayer];
        preview.backgroundColor = [UIColor blackColor].CGColor;
        preview.videoGravity = AVLayerVideoGravityResizeAspectFill;
        [preview removeFromSuperlayer];
        preview.frame = CGRectInset(self.preview.bounds, 0, (CGRectGetHeight(weakSelf.preview.bounds) - kScreenWidth / 4 * 3) / 2);
        
        [weakSelf.preview.layer addSublayer:preview];
        
        //2.doubleTap
        UITapGestureRecognizer *tapGR = [[UITapGestureRecognizer alloc] initWithTarget:weakSelf action:@selector(tapGR:)];
        tapGR.numberOfTapsRequired = 2;
        
        [weakSelf.preview addGestureRecognizer:tapGR];
    }];
    
    [_recorder setFinishBlock:^(NSDictionary *info, WKRecorderFinishedReason reason){
        switch (reason) {
            case WKRecorderFinishedReasonNormal:
            case WKRecorderFinishedReasonBeyondMaxDuration:{//正常结束

                UIStoryboard *sb = [UIStoryboard storyboardWithName:@"Main" bundle:nil];
                WCSPreviewViewController *previewVC = [sb instantiateViewControllerWithIdentifier:@"WCSPreviewViewController"];
                previewVC.movieInfo = info;
                
                [weakSelf.navigationController pushViewController:previewVC animated:YES];
                
                break;
                
            }
            case WKRecorderFinishedReasonCancle:{//重置
                
                
                break;
            }
                
            default:
                break;
        }
        NSLog(@"随便你要干什么");
    }];
    
    [_recorder setFocusAreaDidChangedBlock:^{//焦点改变
        
    }];
    
    [_longPressButton setStateChangeBlock:^(WKState state){
        __strong typeof(weakSelf) strongSelf = weakSelf;
        switch (state) {
            case WKStateBegin: {
                
                [strongSelf.recorder startCapture];
                
                [strongSelf.statusLabel.superview bringSubviewToFront:strongSelf.statusLabel];
                
                [strongSelf showStatusLabelWithBackgroundColor:[UIColor clearColor] textColor:[UIColor greenColor] state:YES];
                
                if (!strongSelf.processLayer) {
                    strongSelf.processLayer = [CALayer layer];
                    strongSelf.processLayer.bounds = CGRectMake(0, 0, CGRectGetWidth(strongSelf.preview.bounds), 5);
                    strongSelf.processLayer.position = CGPointMake(CGRectGetMidX(strongSelf.preview.bounds), CGRectGetHeight(strongSelf.preview.bounds) - 2.5);
                    strongSelf.processLayer.backgroundColor = [UIColor greenColor].CGColor;
                }
                [strongSelf addAnimation];
                
                [strongSelf.preview.layer addSublayer:strongSelf.processLayer];
                
                
                [strongSelf.longPressButton disappearAnimation];
                
                break;
            }
            case WKStateIn: {
                [strongSelf showStatusLabelWithBackgroundColor:[UIColor clearColor] textColor:[UIColor greenColor] state:YES];

                break;
            }
            case WKStateOut: {

                [strongSelf showStatusLabelWithBackgroundColor:[UIColor redColor] textColor:[UIColor whiteColor] state:NO];
                break;
            }
            case WKStateCancle: {
                [strongSelf.recorder cancleCaputre];
                [strongSelf endRecord];
                break;
            }
            case WKStateFinish: {
                [strongSelf.recorder stopCapture];
                [strongSelf endRecord];
                break;
            }
        }
    }];
}

#pragma mark - Orientation
- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
    [super viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
    
    // Note that the app delegate controls the device orientation notifications required to use the device orientation.
    UIDeviceOrientation deviceOrientation = [UIDevice currentDevice].orientation;
    if ( UIDeviceOrientationIsPortrait( deviceOrientation ) || UIDeviceOrientationIsLandscape( deviceOrientation ) ) {
        AVCaptureVideoPreviewLayer *previewLayer = [_recorder getPreviewLayer];
        previewLayer.connection.videoOrientation = (AVCaptureVideoOrientation)deviceOrientation;
        
        UIInterfaceOrientation statusBarOrientation = [UIApplication sharedApplication].statusBarOrientation;
        AVCaptureVideoOrientation initialVideoOrientation = AVCaptureVideoOrientationPortrait;
        if ( statusBarOrientation != UIInterfaceOrientationUnknown ) {
            initialVideoOrientation = (AVCaptureVideoOrientation)statusBarOrientation;
        }
        
        [_recorder videoConnection].videoOrientation = initialVideoOrientation;
    }
}

- (void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration NS_DEPRECATED_IOS(2_0,8_0, "Implement viewWillTransitionToSize:withTransitionCoordinator: instead") __TVOS_PROHIBITED
{
    [super willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
    UIDeviceOrientation deviceOrientation = [UIDevice currentDevice].orientation;
    if ( UIDeviceOrientationIsPortrait( deviceOrientation ) || UIDeviceOrientationIsLandscape( deviceOrientation ) ) {
        AVCaptureVideoPreviewLayer *previewLayer = [_recorder getPreviewLayer];
        previewLayer.connection.videoOrientation = (AVCaptureVideoOrientation)deviceOrientation;
        
        UIInterfaceOrientation statusBarOrientation = [UIApplication sharedApplication].statusBarOrientation;
        AVCaptureVideoOrientation initialVideoOrientation = AVCaptureVideoOrientationPortrait;
        if ( statusBarOrientation != UIInterfaceOrientationUnknown ) {
            initialVideoOrientation = (AVCaptureVideoOrientation)statusBarOrientation;
        }
        
        [_recorder videoConnection].videoOrientation = initialVideoOrientation;
    }
}

//双击 焦距调整
- (void)tapGR:(UITapGestureRecognizer *)tapGes
{

    
    CGFloat scaleFactor = self.isScale ? 1 : 2.f;
    
    self.scale = !self.isScale;
    
    [_recorder setScaleFactor:scaleFactor];
    
}

- (void)addAnimation
{
    _processLayer.hidden = NO;
    _processLayer.backgroundColor = [UIColor cyanColor].CGColor;
    
    CABasicAnimation *scaleXAnimation = [CABasicAnimation animationWithKeyPath:@"transform.scale.x"];
    scaleXAnimation.duration = 10.f;
    scaleXAnimation.fromValue = @(1.f);
    scaleXAnimation.toValue = @(0.f);
    
    [_processLayer addAnimation:scaleXAnimation forKey:@"scaleXAnimation"];
}

- (void)showStatusLabelWithBackgroundColor:(UIColor *)color textColor:(UIColor *)textColor state:(BOOL)isIn
{
    _statusLabel.backgroundColor = color;
    _statusLabel.textColor = textColor;
    _statusLabel.hidden = NO;
    
    _statusLabel.text = isIn ? @"上移取消" : @"松手取消";
}

- (void)endRecord
{
    [_processLayer removeAllAnimations];
    _processLayer.hidden = YES;
    _statusLabel.hidden = YES;
    [self.longPressButton appearAnimation];
}




@end
