//
//  WCSPreviewViewController.m
//  WeChatSightDemo
//
//  Created by 吴珂 on 16/8/26.
//  Copyright © 2016年 吴珂. All rights reserved.
//

#import "WCSPreviewViewController.h"
#import "WKMovieRecorder.h"
#import "WKVideoConverter.h"
#import "UIImageView+PlayGIF.h"
#import "WCSPlayMovieController.h"

#define kScreenWidth [UIScreen mainScreen].bounds.size.width
#define kScreenHeight [UIScreen mainScreen].bounds.size.height
@interface WCSPreviewViewController ()

@property (weak, nonatomic) IBOutlet UIButton *previewButton;//预览按钮
@property (weak, nonatomic) IBOutlet UIImageView *preImageView;//播放gif

@property (nonatomic, strong) AVPlayer *player;

@property (nonatomic, strong) WKVideoConverter *converter;

@property (nonatomic, strong) AVPlayerLayer *playerLayer;

@property (nonatomic, strong) NSURL *videoURL;

@property (nonatomic, strong) NSURL *gifURL;

@property (nonatomic, strong) WCSPlayMovieController *playVC;



- (IBAction)showMovieAction:(id)sender;

@end

@implementation WCSPreviewViewController

#pragma mark - life cycle
- (void)viewDidLoad {
    [super viewDidLoad];
    
    [self setupUI];
    
    
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    
}

- (void)dealloc
{
    NSLog(@"%s", __FUNCTION__);
}

#pragma mark - setup
- (void)setupUI
{
    _previewButton.userInteractionEnabled = NO;
    
    //1.生成文件名
    NSDateFormatter *df = [NSDateFormatter new];
    df.dateFormat = @"yyyy-MM-dd'T'HH:mm:ss.SSS";
    NSString *name = [df stringFromDate:[NSDate date]];
    NSString *gifName = [name stringByAppendingPathExtension:@".gif"];
    NSString *videoName = [name stringByAppendingPathExtension:@".mp4"];
    
    //2.拷贝视频
    [self copyVideoWithMovieName:videoName];
    
    //3.生成gif
    _preImageView.contentMode = UIViewContentModeScaleAspectFill;
    _preImageView.layer.masksToBounds = YES;
    _preImageView.image = self.movieInfo[WKRecorderFirstFrame];
    [self generateAndShowGifWithName:gifName];
    
    
    
}

- (NSString *)generateMoviePathWithFileName:(NSString *)name
{
    NSString *documetPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
    
    NSString *moviePath = [documetPath stringByAppendingPathComponent:name];
    
    return moviePath;
}

- (void)copyVideoWithMovieName:(NSString *)movieName
{
    //1.生成视屏URL
    NSMutableString *videoName = [movieName mutableCopy];
    NSURL *videoURL = _movieInfo[WKRecorderMovieURL];
    
    [videoName stringByAppendingPathExtension:@".mp4"];
    
    [videoName replaceOccurrencesOfString:@" " withString:@"" options:NSCaseInsensitiveSearch range:NSMakeRange(0, videoName.length)];
    
    NSString *videoPath = [self generateMoviePathWithFileName:videoName];
    NSURL *newVideoURL = [NSURL fileURLWithPath:videoPath];
    NSError *error = nil;
    
    [[NSFileManager defaultManager] copyItemAtURL:videoURL toURL:newVideoURL error:&error];
    
    
    if (error) {
        
        NSLog(@"%@", [error localizedDescription]);
        
    }else{
        self.videoURL = newVideoURL;
    }

}

- (void)generateAndShowGifWithName:(NSString *)gifName
{
    NSString *gifPath = [self generateMoviePathWithFileName:gifName];
    NSURL *newVideoURL = [NSURL fileURLWithPath:gifPath];

    WKVideoConverter *converter = [[WKVideoConverter alloc] init];
    
    
    [converter convertVideoToGifImageWithURL:self.videoURL destinationUrl:newVideoURL finishBlock:^{//播放gif
        _previewButton.userInteractionEnabled = YES;
        _preImageView.gifPath = gifPath;
        [_preImageView startGIF];
    }];
    
    _converter = converter;
}

- (IBAction)showMovieAction:(id)sender {
    WCSPlayMovieController *playVC = [[WCSPlayMovieController alloc] init];
    playVC.movieURL = self.videoURL;
    
    [self displayChildController:playVC];
    
    _playVC = playVC;
}

#pragma mark - displayChildController
- (void) displayChildController: (UIViewController*) child {
    [self addChildViewController:child];
    [self.view addSubview:child.view];
    child.view.frame = self.view.frame;
    [child didMoveToParentViewController:self];
}

- (void) hideContentController: (UIViewController*) child {
    [child willMoveToParentViewController:nil];
    [child.view removeFromSuperview];
    [child removeFromParentViewController];
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    [self hideContentController:self.playVC];
    self.playVC = nil;
}


@end
