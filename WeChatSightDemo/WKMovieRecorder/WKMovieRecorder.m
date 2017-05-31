//
//  WKMovieRecorder.m
//  CapturePause
//
//  Created by 吴珂 on 16/7/7.
//  Copyright © 2016年 Geraint Davies. All rights reserved.
//

#import "WKMovieRecorder.h"
#import "WKMovieWriter.h"
#import "AssetsLibrary/ALAssetsLibrary.h"
#import <UIKit/UIKit.h>
#import "WKVideoConverter.h"

#define DebugMovie 0

const NSString * const WKRecorderLastFrame = @"WKRecorderLastFrame";
const NSString * const WKRecorderMovieURL = @"WKRecorderMovieURL";
const NSString * const WKRecorderDuration = @"WKRecorderDuration";
const NSString * const WKRecorderAllFrames = @"WKRecorderAllFrames";
const NSString * const WKRecorderFirstFrame = @"WKRecorderFirstFrame";

static void *SessionRunningContext = &SessionRunningContext;
static void *CapturingStillImageContext = &CapturingStillImageContext;
static void *FocusAreaChangedContext = &FocusAreaChangedContext;

typedef NS_ENUM( NSInteger, CaptureAVSetupResult ) {
    CaptureAVSetupResultSuccess,
    CaptureAVSetupResultCameraNotAuthorized,
    CaptureAVSetupResultSessionConfigurationFailed
};



@interface WKMovieRecorder ()
<
AVCaptureVideoDataOutputSampleBufferDelegate,
AVCaptureAudioDataOutputSampleBufferDelegate,
WKMovieWriterDelegate
>
{
    AVCaptureSession* _session;
    AVCaptureVideoPreviewLayer* _preview;
    
    WKMovieWriter* _writer;
    BOOL _isCapturing;
    BOOL _isPaused;
    BOOL _discont;
    int _currentFile;
    CMTime _timeOffset;
    CMTime _lastVideo;
    CMTime _lastAudio;
    
    NSTimeInterval _maxDuration;
    //    UIImage *_lastFrame;
}

/**
 准备完成后调用的block
 */
@property (nonatomic, copy) void (^prepareBlock)(void);


// Session management.
@property (nonatomic, strong) dispatch_queue_t sessionQueue;
@property (nonatomic, strong) dispatch_queue_t videoDataOutputQueue;
@property (nonatomic, strong) AVCaptureSession *session;
@property (nonatomic, strong) AVCaptureDevice *captureDevice;
@property (nonatomic, strong) AVCaptureDeviceInput *videoDeviceInput;
@property (nonatomic, strong) AVCaptureStillImageOutput *stillImageOutput;
@property (nonatomic, strong) AVCaptureConnection *videoConnection;
@property (nonatomic, strong) AVCaptureConnection *audioConnection;
@property (nonatomic, strong) NSDictionary *videoCompressionSettings;
@property (nonatomic, strong) NSDictionary *audioCompressionSettings;
@property (nonatomic, strong) AVAssetWriterInputPixelBufferAdaptor *adaptor;
@property (nonatomic, strong) AVCaptureVideoDataOutput *videoDataOutput;



//Utilities
@property (nonatomic, strong) NSMutableArray *frames;//存储录制帧
@property (nonatomic, assign) CaptureAVSetupResult result;
@property (atomic, readwrite) BOOL isCapturing;
@property (atomic, readwrite) BOOL isPaused;
@property (nonatomic, strong) NSTimer *durationTimer;

@property (nonatomic, assign) WKRecorderFinishedReason finishReason;
@end

@implementation WKMovieRecorder
@synthesize duration = _duration;
+ (WKMovieRecorder *)sharedRecorder
{
    static WKMovieRecorder *recorder;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        recorder = [[WKMovieRecorder alloc] initWithMaxDuration:CGFLOAT_MAX];
    });
    
    return recorder;
}

- (instancetype)initWithMaxDuration:(NSTimeInterval)duration
{
    if(self = [self init]){
        _maxDuration = duration;
        _duration = 0.f;
    }
    
    return self;
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        _maxDuration = CGFLOAT_MAX;
        _duration = 0.f;
        _sessionQueue = dispatch_queue_create("wukong.movieRecorder.queue", DISPATCH_QUEUE_SERIAL );
        _videoDataOutputQueue = dispatch_queue_create( "wukong.movieRecorder.video", DISPATCH_QUEUE_SERIAL );
        dispatch_set_target_queue( _videoDataOutputQueue, dispatch_get_global_queue( DISPATCH_QUEUE_PRIORITY_HIGH, 0 ) );
    }
    return self;
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self name:nil object:self.session];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:AVCaptureSessionWasInterruptedNotification object:self.session];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:AVCaptureSessionInterruptionEndedNotification object:self.session];
    if (_captureDevice.position == AVCaptureDevicePositionBack) {
        
        [_captureDevice removeObserver:self forKeyPath:@"adjustingFocus"];
    }
    
    [_session beginConfiguration];
    [self.session removeInput:self.videoDeviceInput];
    [_session commitConfiguration];
    
    
    //    [_session removeInput:self.videoDeviceInput];
    
    
    
    if ([_session isRunning]){
        [_session stopRunning];
        _session = nil;
    }
    
    NSLog(@"%s", __FUNCTION__);
}

- (void)setup
{
    if (_session == nil)
    {
        NSLog(@"Starting up server");
        
        self.isCapturing = NO;
        self.isPaused = NO;
        _currentFile = 0;
        _discont = NO;
        
        
        
        
        self.session = [[AVCaptureSession alloc] init];
        
        self.result = CaptureAVSetupResultSuccess;
        
        //权限检查
        dispatch_group_t group = dispatch_group_create();
        [self checkAuthorization:group];
        
        dispatch_async(dispatch_get_main_queue(), ^{
            dispatch_group_notify(group, dispatch_get_main_queue(), ^{
                NSLog(@"notity--------");
            });
        });
        
        dispatch_group_notify(group, self.sessionQueue, ^{
            if (self.result != CaptureAVSetupResultSuccess) {
                
                if (self.authorizationResultBlock) {
                    self.authorizationResultBlock(NO);
                }
                return;
            }
            
            AVCaptureDevice *captureDevice = [[self class] deviceWithMediaType:AVMediaTypeVideo preferringPosition:AVCaptureDevicePositionBack];
            
            _captureDevice = captureDevice;
            
            NSError *error = nil;
            _videoDeviceInput = [[AVCaptureDeviceInput alloc] initWithDevice:captureDevice error:&error];
            
            if (!_videoDeviceInput) {
                NSLog(@"未找到设备");
            }
            
            
            //配置会话
            [self.session beginConfiguration];
            
            int frameRate;
            if ( [NSProcessInfo processInfo].processorCount == 1 )
            {
                if ([self.session canSetSessionPreset:AVCaptureSessionPresetLow]) {
                    [self.session setSessionPreset:AVCaptureSessionPresetLow];
                }
                frameRate = 10;
            }else{
                if ([self.session canSetSessionPreset:AVCaptureSessionPreset640x480]) {
                    [self.session setSessionPreset:AVCaptureSessionPreset640x480];
                }
                frameRate = 30;
            }
            
            CMTime frameDuration = CMTimeMake( 1, frameRate );
            
            if ( [_captureDevice lockForConfiguration:&error] ) {
                _captureDevice.activeVideoMaxFrameDuration = frameDuration;
                _captureDevice.activeVideoMinFrameDuration = frameDuration;
                [_captureDevice unlockForConfiguration];
            }
            else {
                NSLog( @"videoDevice lockForConfiguration returned error %@", error );
            }
            
            
            //Video
            if ([self.session canAddInput:_videoDeviceInput]) {
                
                [self.session addInput:_videoDeviceInput];
                self.videoDeviceInput = _videoDeviceInput;
                [self.session removeOutput:_videoDataOutput];
                
                AVCaptureVideoDataOutput *videoOutput = [[AVCaptureVideoDataOutput alloc] init];
                _videoDataOutput = videoOutput;
                videoOutput.videoSettings = @{ (id)kCVPixelBufferPixelFormatTypeKey : @(kCVPixelFormatType_32BGRA) };
                
                [videoOutput setSampleBufferDelegate:self queue:_videoDataOutputQueue];
                
                videoOutput.alwaysDiscardsLateVideoFrames = NO;
                
                if ( [_session canAddOutput:videoOutput] ) {
                    [_session addOutput:videoOutput];
                    
                    [_captureDevice addObserver:self forKeyPath:@"adjustingFocus" options:NSKeyValueObservingOptionNew context:FocusAreaChangedContext];
                    
                    _videoConnection = [videoOutput connectionWithMediaType:AVMediaTypeVideo];
                    
                    if(_videoConnection.isVideoStabilizationSupported){
                        _videoConnection.preferredVideoStabilizationMode = AVCaptureVideoStabilizationModeAuto;
                    }
                    
                    
                    UIInterfaceOrientation statusBarOrientation = [UIApplication sharedApplication].statusBarOrientation;
                    AVCaptureVideoOrientation initialVideoOrientation = AVCaptureVideoOrientationPortrait;
                    if ( statusBarOrientation != UIInterfaceOrientationUnknown ) {
                        initialVideoOrientation = (AVCaptureVideoOrientation)statusBarOrientation;
                    }
                    
                    _videoConnection.videoOrientation = initialVideoOrientation;
                }
                
            }
            else{
                NSLog(@"无法添加视频输入到会话");
            }
            
            //audio
            AVCaptureDevice *audioDevice = [AVCaptureDevice defaultDeviceWithMediaType:AVMediaTypeAudio];
            AVCaptureDeviceInput *audioDeviceInput = [AVCaptureDeviceInput deviceInputWithDevice:audioDevice error:&error];
            
            
            if ( ! audioDeviceInput ) {
                NSLog( @"Could not create audio device input: %@", error );
            }
            
            if ( [self.session canAddInput:audioDeviceInput] ) {
                [self.session addInput:audioDeviceInput];
                
            }
            else {
                NSLog( @"Could not add audio device input to the session" );
            }
            
            
            
            AVCaptureAudioDataOutput *audioOut = [[AVCaptureAudioDataOutput alloc] init];
            // Put audio on its own queue to ensure that our video processing doesn't cause us to drop audio
            dispatch_queue_t audioCaptureQueue = dispatch_queue_create( "wukong.movieRecorder.audio", DISPATCH_QUEUE_SERIAL );
            [audioOut setSampleBufferDelegate:self queue:audioCaptureQueue];
            
            
            if ( [self.session canAddOutput:audioOut] ) {
                [self.session addOutput:audioOut];
            }
            _audioConnection = [audioOut connectionWithMediaType:AVMediaTypeAudio];
            
            [self.session commitConfiguration];
            
            if (self.prepareBlock) {
                if (!_session.isRunning) {
                    [_session startRunning];
                }
                
                dispatch_async(dispatch_get_main_queue(), ^{
                    
                    self.prepareBlock();
                });
            }
        });
        
        _preview = [AVCaptureVideoPreviewLayer layerWithSession:_session];
        _preview.videoGravity = AVLayerVideoGravityResizeAspectFill;
    }
    
    
    
    
    [self addObservers];
}


/**
 权限检查
 */
- (void)checkAuthorization:(dispatch_group_t)group
{
    dispatch_group_enter(group);
    switch ([AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo]) {
        case AVAuthorizationStatusNotDetermined: {
            [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
                self.result = granted ? CaptureAVSetupResultSuccess : CaptureAVSetupResultCameraNotAuthorized;
                dispatch_group_leave(group);
            }];
            break;
        }
        case AVAuthorizationStatusAuthorized: {
            dispatch_group_leave(group);
            break;
        }
        default:{
            self.result = CaptureAVSetupResultCameraNotAuthorized;
            dispatch_group_leave(group);
        }
    }
    
    if (self.result != CaptureAVSetupResultCameraNotAuthorized) {
        dispatch_group_enter(group);
        switch ([AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeAudio]) {
            case AVAuthorizationStatusNotDetermined: {
                [AVCaptureDevice requestAccessForMediaType:AVMediaTypeAudio completionHandler:^(BOOL granted) {
                    
                    self.result = granted ? CaptureAVSetupResultSuccess : CaptureAVSetupResultCameraNotAuthorized;
                    dispatch_group_leave(group);
                }];
                break;
            }
            case AVAuthorizationStatusAuthorized: {
                dispatch_group_leave(group);
                break;
            }
            default:{
                self.result = CaptureAVSetupResultCameraNotAuthorized;
                dispatch_group_leave(group);
            }
        }
        
    }
}

#pragma mark - Recording

- (void) startCapture
{
    @synchronized(self)
    {
        dispatch_async(_sessionQueue, ^{
            
            
            if (!self.isCapturing)
            {
                if (![_session isRunning]) {
                    [_session startRunning];
                }
                NSLog(@"starting capture");
                [self.frames removeAllObjects];
                _currentFile++;
                // create the encoder once we have the audio params
                _writer = nil;
                self.isPaused = NO;
                _discont = NO;
                _timeOffset = CMTimeMake(0, 0);
                self.isCapturing = YES;
                
                dispatch_async(dispatch_get_main_queue(), ^{
                    
                    _durationTimer = [NSTimer scheduledTimerWithTimeInterval:0.1f target:self selector:@selector(computeDuration:) userInfo:nil repeats:YES];
                });
                _duration = 0.f;
            }
        });
        
    }
}

- (void)prepareCaptureWithBlock:(void (^)())block
{
    self.prepareBlock = block;
    [self setup];
}

- (void) stopCapture
{
    [_session stopRunning];
    [self finishCaptureWithReason:WKRecorderFinishedReasonNormal];
}

- (void)cancleCaputre
{
    [_session stopRunning];
    [self finishCaptureWithReason:WKRecorderFinishedReasonCancle];
}

- (void)finishCapture
{
    [_session stopRunning];
}

/**
 *  结束录制
 *
 *  @param isCancle yes 取消 NO 正常结束
 */
- (void)finishCaptureWithReason:(WKRecorderFinishedReason)reason
{
    @synchronized(self)
    {
        if (self.isCapturing)
        {
            // serialize with audio and video capture
            
            self.isCapturing = NO;
            [_durationTimer invalidate];
            dispatch_async(_sessionQueue, ^{
                switch (reason) {
                    case WKRecorderFinishedReasonNormal:{
                        [_writer finishRecording];
                        break;
                        
                    }
                    case WKRecorderFinishedReasonBeyondMaxDuration:{
                        [_writer finishRecording];
                        break;
                    }
                    case WKRecorderFinishedReasonCancle:{
                        [_writer cancleRecording];
                        break;
                    }
                        
                    default:
                        break;
                }
                
                self.finishReason = reason;
            });
            
        }
    }
    
}

- (void) pauseCapture
{
    @synchronized(self)
    {
        if (self.isCapturing)
        {
            NSLog(@"Pausing capture");
            self.isPaused = YES;
            [_durationTimer invalidate];
            _discont = YES;
        }
    }
}

- (void) resumeCapture
{
    @synchronized(self)
    {
        if (self.isPaused)
        {
            NSLog(@"Resuming capture");
            self.isPaused = NO;
            dispatch_async(dispatch_get_main_queue(), ^{
                
                _durationTimer = [NSTimer scheduledTimerWithTimeInterval:0.1f target:self selector:@selector(computeDuration:) userInfo:nil repeats:YES];
            });
        }
    }
}

- (void) shutdown
{
    NSLog(@"shutting down server");
    if (_session)
    {
        [_session stopRunning];
        _session = nil;
    }
    
    [_writer finishRecording];
    
}


- (AVCaptureVideoPreviewLayer*) getPreviewLayer
{
    return _preview;
}


#pragma mark 时常限制
- (void)computeDuration:(NSTimer *)timer
{
    if (self.isCapturing) {
        [self willChangeValueForKey:@"duration"];
        _duration += 0.1;
        [self didChangeValueForKey:@"duration"];
        NSLog(@"%f", _duration);
        if (_duration >= _maxDuration) {
            [self finishCaptureWithReason:WKRecorderFinishedReasonBeyondMaxDuration];
            [timer invalidate];
            NSLog(@"录制超时,结束录制");
        }
    }
}

- (void)startSession
{
    dispatch_async(self.sessionQueue, ^{
        
        if (!_session.isRunning) {
            [_session startRunning];
        }
    });
}


- (CMSampleBufferRef) adjustTime:(CMSampleBufferRef) sample by:(CMTime) offset
{
    CMItemCount count;
    CMSampleBufferGetSampleTimingInfoArray(sample, 0, nil, &count);
    CMSampleTimingInfo* pInfo = malloc(sizeof(CMSampleTimingInfo) * count);
    CMSampleBufferGetSampleTimingInfoArray(sample, count, pInfo, &count);
    for (CMItemCount i = 0; i < count; i++)
    {
        pInfo[i].decodeTimeStamp = CMTimeSubtract(pInfo[i].decodeTimeStamp, offset);
        pInfo[i].presentationTimeStamp = CMTimeSubtract(pInfo[i].presentationTimeStamp, offset);
    }
    CMSampleBufferRef sout;
    CMSampleBufferCreateCopyWithNewTiming(nil, sample, count, pInfo, &sout);
    free(pInfo);
    return sout;
}

#pragma mark - setting

- (BOOL)setScaleFactor:(CGFloat)factor
{
    [_captureDevice lockForConfiguration:nil];
    
    BOOL success = NO;
    
    if(_captureDevice.activeFormat.videoMaxZoomFactor > factor){
        //        _captureDevice.videoZoomFactor = factor;
        
        [_captureDevice rampToVideoZoomFactor:factor withRate:30.f];//平滑过渡
        
        NSLog(@"Current format: %@, max zoom factor: %f", _captureDevice.activeFormat, _captureDevice.activeFormat.videoMaxZoomFactor);
        success = YES;
    }
    [_captureDevice unlockForConfiguration];
    
    return success;
}

- (void)changeCamera
{
    dispatch_async( self.sessionQueue, ^{
        
        AVCaptureDevice *currentVideoDevice = self.videoDeviceInput.device;
        AVCaptureDevicePosition preferredPosition = AVCaptureDevicePositionUnspecified;
        AVCaptureDevicePosition currentPosition = currentVideoDevice.position;
        
        switch ( currentPosition )
        {
            case AVCaptureDevicePositionUnspecified:
            case AVCaptureDevicePositionFront:
                preferredPosition = AVCaptureDevicePositionBack;
                break;
            case AVCaptureDevicePositionBack:
                preferredPosition = AVCaptureDevicePositionFront;
                break;
        }
        
        if (_captureDevice.position == AVCaptureDevicePositionBack) {
            [_captureDevice removeObserver:self forKeyPath:@"adjustingFocus"];
        }
        
        _captureDevice = [[self class] deviceWithMediaType:AVMediaTypeVideo preferringPosition:preferredPosition];
        AVCaptureDeviceInput *videoDeviceInput = [AVCaptureDeviceInput deviceInputWithDevice:_captureDevice error:nil];
        
        [self.session beginConfiguration];
        
        // Remove the existing device input first, since using the front and back camera simultaneously is not supported.
        [self.session removeInput:self.videoDeviceInput];
        
        if ( [self.session canAddInput:videoDeviceInput] ) {
            
            [self.session addInput:videoDeviceInput];
            
            if (_captureDevice.position != AVCaptureDevicePositionFront) {
                [_captureDevice lockForConfiguration:nil];
                _captureDevice.subjectAreaChangeMonitoringEnabled = YES;
                [_captureDevice addObserver:self forKeyPath:@"adjustingFocus" options:NSKeyValueObservingOptionNew context:FocusAreaChangedContext];
                [_captureDevice unlockForConfiguration];
            }
            
            self.videoDeviceInput = videoDeviceInput;
        }
        else {
            
            [self.session addInput:self.videoDeviceInput];
        }
        
        
        
        _videoConnection = [self.videoDataOutput connectionWithMediaType:AVMediaTypeVideo];
        
        if(_videoConnection.isVideoStabilizationSupported){
            _videoConnection.preferredVideoStabilizationMode = AVCaptureVideoStabilizationModeAuto;
        }
        
        UIInterfaceOrientation statusBarOrientation = [UIApplication sharedApplication].statusBarOrientation;
        AVCaptureVideoOrientation initialVideoOrientation = AVCaptureVideoOrientationPortrait;
        if ( statusBarOrientation != UIInterfaceOrientationUnknown ) {
            initialVideoOrientation = (AVCaptureVideoOrientation)statusBarOrientation;
        }
        
        _videoConnection.videoOrientation = initialVideoOrientation;
        
        [self.session commitConfiguration];
        
        if (![_session isRunning]) {
            [_session startRunning];
        }
    } );
}



#pragma mark - AVCaptureVideoDataOutputSampleBufferDelegate、AVCaptureAudioDataOutputSampleBufferDelegate
- (void) captureOutput:(AVCaptureOutput *)captureOutput didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer fromConnection:(AVCaptureConnection *)connection
{
    BOOL bVideo = YES;
    
    @synchronized(self)
    {
        if (!self.isCapturing  || self.isPaused)
        {
            return;
        }
        if (connection != _videoConnection)
        {
            bVideo = NO;
        }
        if ((_writer == nil) && !bVideo)
        {
            NSString* filename = [NSString stringWithFormat:@"capture11%d.mp4", _currentFile];
            NSString* path = [NSTemporaryDirectory() stringByAppendingPathComponent:filename];
            _recordURL = [NSURL fileURLWithPath:path];
            _writer  = [[WKMovieWriter alloc] initWithURL:_recordURL cropSize:_cropSize];
            
            
            _writer.delegate = self;
            
        }
        if (_discont)
        {
            if (bVideo)
            {
                return;
            }
            _discont = NO;
            // calc adjustment
            CMTime pts = CMSampleBufferGetPresentationTimeStamp(sampleBuffer);
            CMTime last = bVideo ? _lastVideo : _lastAudio;
            if (last.flags & kCMTimeFlags_Valid)
            {
                if (_timeOffset.flags & kCMTimeFlags_Valid)
                {
                    pts = CMTimeSubtract(pts, _timeOffset);
                }
                CMTime offset = CMTimeSubtract(pts, last);
                NSLog(@"Setting offset from %s", bVideo?"video": "audio");
                NSLog(@"Adding %f to %f (pts %f)", ((double)offset.value)/offset.timescale, ((double)_timeOffset.value)/_timeOffset.timescale, ((double)pts.value/pts.timescale));
                
                // this stops us having to set a scale for _timeOffset before we see the first video time
                if (_timeOffset.value == 0)
                {
                    _timeOffset = offset;
                }
                else
                {
                    _timeOffset = CMTimeAdd(_timeOffset, offset);
                }
            }
            _lastVideo.flags = 0;
            _lastAudio.flags = 0;
        }
        
        // retain so that we can release either this or modified one
        CFRetain(sampleBuffer);
        
        if (_timeOffset.value > 0)
        {
            CFRelease(sampleBuffer);
            sampleBuffer = [self adjustTime:sampleBuffer by:_timeOffset];
        }
        
        // record most recent time so we know the length of the pause
        CMTime pts = CMSampleBufferGetPresentationTimeStamp(sampleBuffer);
        CMTime dur = CMSampleBufferGetDuration(sampleBuffer);
        if (dur.value > 0)
        {
            pts = CMTimeAdd(pts, dur);
        }
        if (bVideo)
        {
            _lastVideo = pts;
            @autoreleasepool {
                if (_maxDuration < 20.f || self.frames.count == 0) {
                    UIImage *frame = [WKVideoConverter convertSampleBufferRefToUIImage:sampleBuffer];
                    [self.frames addObject:frame];
                }
            }
            //                _lastFrame = [WKVideoConverter convertSampleBufferRefToUIImage:sampleBuffer];
            
            
            
            //            _lastFrame = [[UIImage alloc] init];
            
            //            CGImageRef cgImage = [WKVideoConverter convertSamepleBufferRefToCGImage:sampleBuffer];
            //            [self.frames addObject:((__bridge id)(cgImage))];
            //            CGImageRelease(cgImage);
            //            _lastFrame = [[UIImage alloc] init];
            [_writer appendVideoBuffer:sampleBuffer];
        }
        else
        {
            _lastAudio = pts;
            [_writer appendAudioBuffer:sampleBuffer];
        }
    }
    
    // pass frame to encoder
    CFRelease(sampleBuffer);
}


#pragma mark - WKMovieWriterDelegate
- (void)movieWriterDidFinishRecording:(WKMovieWriter *)recorder status:(BOOL)isCancle
{
    self.isCapturing = NO;
    _writer = nil;
    
    NSString* filename = [NSString stringWithFormat:@"capture11%d.mp4", _currentFile];
    NSString* path = [NSTemporaryDirectory() stringByAppendingPathComponent:filename];
#if DebugMovie
    ALAssetsLibrary *library = [[ALAssetsLibrary alloc] init];
    [library writeVideoAtPathToSavedPhotosAlbum:recorder.recordingURL completionBlock:^(NSURL *assetURL, NSError *error){
        NSLog(@"save completed");
        //        [[NSFileManager defaultManager] removeItemAtPath:path error:nil];
    }];
#endif
    
    if (self.finishBlock){
        NSMutableDictionary *info = [@{WKRecorderMovieURL : [NSURL fileURLWithPath:path],
                                       WKRecorderDuration : @(_duration),
                                       } mutableCopy];
        if (self.frames.count != 0) {//小视频
            [info setObject:[self.frames mutableCopy] forKey:WKRecorderAllFrames];
            [info setObject:[self.frames firstObject] forKey:WKRecorderFirstFrame];
            [info setObject:[self.frames lastObject] forKey:WKRecorderLastFrame];
        }
        self.finishBlock(info, self.finishReason);
    }
    
}



#pragma mark KVO and Notifications
- (void)addObservers
{
    //    [self.session addObserver:self forKeyPath:@"running" options:NSKeyValueObservingOptionNew context:SessionRunningContext];
    //    [self.stillImageOutput addObserver:self forKeyPath:@"capturingStillImage" options:NSKeyValueObservingOptionNew context:CapturingStillImageContext];
    
    //    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(subjectAreaDidChange:) name:AVCaptureDeviceSubjectAreaDidChangeNotification object:self.videoDeviceInput.device];
    //    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(sessionRuntimeError:) name:AVCaptureSessionRuntimeErrorNotification object:self.session];
    // A session can only run when the app is full screen. It will be interrupted in a multi-app layout, introduced in iOS 9,
    // see also the documentation of AVCaptureSessionInterruptionReason. Add observers to handle these session interruptions
    // and show a preview is paused message. See the documentation of AVCaptureSessionWasInterruptedNotification for other
    // interruption reasons.
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(sessionWasInterrupted:) name:AVCaptureSessionWasInterruptedNotification object:self.session];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(sessionInterruptionEnded:) name:AVCaptureSessionInterruptionEndedNotification object:self.session];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
    if ( context == SessionRunningContext ) {
        //        BOOL isSessionRunning = [change[NSKeyValueChangeNewKey] boolValue];
        
        dispatch_async( dispatch_get_main_queue(), ^{
            //            NSLog(@"%s", __FUNCTION__);
        } );
    }else if (context == FocusAreaChangedContext){
        
        if ([change[NSKeyValueChangeNewKey] integerValue] == 1) {
            
            if (self.focusAreaDidChangedBlock) {
                dispatch_async( dispatch_get_main_queue(), ^{
                    //                    NSLog(@"%s", __FUNCTION__);
                    self.focusAreaDidChangedBlock();
                } );
            }
        }
        
    }
    else {
        [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
    }
}


- (void)subjectAreaDidChange:(NSNotification *)notification
{
    CGPoint devicePoint = CGPointMake( 0.5, 0.5 );
    //    [self focusWithMode:AVCaptureFocusModeContinuousAutoFocus exposeWithMode:AVCaptureExposureModeContinuousAutoExposure atDevicePoint:devicePoint monitorSubjectAreaChange:NO];
    //    NSLog(@"%s", __FUNCTION__);
}

- (void)sessionRuntimeError:(NSNotification *)notification
{
    NSError *error = notification.userInfo[AVCaptureSessionErrorKey];
    NSLog( @"Capture session runtime error: %@", error );
    
    // Automatically try to restart the session running if media services were reset and the last start running succeeded.
    // Otherwise, enable the user to try to resume the session running.
    if ( error.code == AVErrorMediaServicesWereReset ) {
        dispatch_async( self.sessionQueue, ^{
            if ( _session.isRunning ) {
                [self.session startRunning];
            }
            else {
                dispatch_async( dispatch_get_main_queue(), ^{
                    
                } );
            }
        } );
    }
    else {
        //        self.resumeButton.hidden = NO;
    }
}

- (void)sessionWasInterrupted:(NSNotification *)notification
{
    // In some scenarios we want to enable the user to resume the session running.
    // For example, if music playback is initiated via control center while using AVCam,
    // then the user can let AVCam resume the session running, which will stop music playback.
    // Note that stopping music playback in control center will not automatically resume the session running.
    // Also note that it is not always possible to resume, see -[resumeInterruptedSession:].
    BOOL showResumeButton = NO;
    
    // In iOS 9 and later, the userInfo dictionary contains information on why the session was interrupted.
    if ( &AVCaptureSessionInterruptionReasonKey ) {
        AVCaptureSessionInterruptionReason reason = [notification.userInfo[AVCaptureSessionInterruptionReasonKey] integerValue];
        NSLog( @"Capture session was interrupted with reason %ld", (long)reason );
        
        if ( reason == AVCaptureSessionInterruptionReasonAudioDeviceInUseByAnotherClient ||
            reason == AVCaptureSessionInterruptionReasonVideoDeviceInUseByAnotherClient ) {
            showResumeButton = YES;
        }
        else if ( reason == AVCaptureSessionInterruptionReasonVideoDeviceNotAvailableWithMultipleForegroundApps ) {
            
            [UIView animateWithDuration:0.25 animations:^{
                
            }];
        }
    }
    else {
        NSLog( @"Capture session was interrupted" );
        showResumeButton = ( [UIApplication sharedApplication].applicationState == UIApplicationStateInactive );
    }
}

- (void)sessionInterruptionEnded:(NSNotification *)notification
{
    NSLog( @"Capture session interruption ended" );
    
    if (!self.session.isRunning) {
        [self.session startRunning];
    }
}


#pragma mark Device Configuration

- (void)addVideoDeviceInput:(AVCaptureDeviceInput *)input videoDevice:(AVCaptureDevice *)device
{
    if ( [self.session canAddInput:input] ) {
        
        
        
        [device lockForConfiguration:nil];
        device.subjectAreaChangeMonitoringEnabled = YES;
        [device addObserver:self forKeyPath:@"adjustingFocus" options:NSKeyValueObservingOptionNew context:FocusAreaChangedContext];
        [device unlockForConfiguration];
        
        
        
        //        [[NSNotificationCenter defaultCenter] removeObserver:self name:AVCaptureDeviceSubjectAreaDidChangeNotification object:device];
        
        [[self class] setFlashMode:AVCaptureFlashModeAuto forDevice:device];
        //        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(subjectAreaDidChange:) name:AVCaptureDeviceSubjectAreaDidChangeNotification object:device];
        
        if ([self.session canAddInput:input]) {
            
            [self.session addInput:input];
        }
        
        self.videoDeviceInput = input;
        
        [self.session removeOutput:_videoDataOutput];
        
        AVCaptureVideoDataOutput *videoOutput = [[AVCaptureVideoDataOutput alloc] init];
        _videoDataOutput = videoOutput;
        videoOutput.videoSettings = @{ (id)kCVPixelBufferPixelFormatTypeKey : @(kCVPixelFormatType_32BGRA) };
        
        [videoOutput setSampleBufferDelegate:self queue:_videoDataOutputQueue];
        
        videoOutput.alwaysDiscardsLateVideoFrames = NO;
        
        if ( [_session canAddOutput:videoOutput] ) {
            [_session addOutput:videoOutput];
            _videoConnection = [videoOutput connectionWithMediaType:AVMediaTypeVideo];
            
            if(_videoConnection.isVideoStabilizationSupported){
                _videoConnection.preferredVideoStabilizationMode = AVCaptureVideoStabilizationModeAuto;
            }
            
            UIInterfaceOrientation statusBarOrientation = [UIApplication sharedApplication].statusBarOrientation;
            AVCaptureVideoOrientation initialVideoOrientation = AVCaptureVideoOrientationPortrait;
            if ( statusBarOrientation != UIInterfaceOrientationUnknown ) {
                initialVideoOrientation = (AVCaptureVideoOrientation)statusBarOrientation;
            }
            
            _videoConnection.videoOrientation = initialVideoOrientation;
        }
        
        //        videoOutput.videoSettings = [NSDictionary dictionaryWithObjectsAndKeys:
        //                                     [NSNumber numberWithInt:kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange], kCVPixelBufferPixelFormatTypeKey,
        //                                     nil];
    }
}
/**
 *  获取设备
 *
 *  @param mediaType 媒体类型
 *  @param position  捕获设备位置
 *
 *  @return 设备
 */
+ (AVCaptureDevice *)deviceWithMediaType:(NSString *)mediaType preferringPosition:(AVCaptureDevicePosition)position
{
    NSArray *devices = [AVCaptureDevice devicesWithMediaType:mediaType];
    AVCaptureDevice *captureDevice = devices.firstObject;
    
    for ( AVCaptureDevice *device in devices ) {
        if ( device.position == position ) {
            captureDevice = device;
            break;
        }
    }
    
    return captureDevice;
}

+ (void)setFlashMode:(AVCaptureFlashMode)flashMode forDevice:(AVCaptureDevice *)device
{
    if ( device.hasFlash && [device isFlashModeSupported:flashMode] ) {
        NSError *error = nil;
        if ( [device lockForConfiguration:&error] ) {
            device.flashMode = flashMode;
            [device unlockForConfiguration];
        }
        else {
            NSLog( @"Could not lock device for configuration: %@", error );
        }
    }
}


//- (NSTimeInterval)duration
//{
//    return _duration;
//}

- (NSMutableArray *)frames
{
    if (!_frames) {
        _frames = [NSMutableArray array];
    }
    return  _frames;
}

- (BOOL)isCapturing
{
    return _isCapturing;
}



@end
