//
//  WKMovieRecorder.h
//  CapturePause
//
//  Created by 吴珂 on 16/7/7.
//  Copyright © 2016年 Geraint Davies. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

extern const NSString * const WKRecorderLastFrame;
extern const NSString * const WKRecorderMovieURL;
extern const NSString * const WKRecorderDuration;
extern const NSString * const WKRecorderAllFrames;
extern const NSString * const WKRecorderFirstFrame;

typedef NS_ENUM(NSInteger, WKRecorderFinishedReason){
    WKRecorderFinishedReasonNormal,//主动结束
    WKRecorderFinishedReasonCancle,//取消
    WKRecorderFinishedReasonBeyondMaxDuration//超时结束
};

/**
 *  录制结束invoke
 *
 *  @param info     回调信息
 *  @param isCancle YES:取消 NO:正常结束
 */
typedef void(^FinishRecordingBlock)(NSDictionary *info, WKRecorderFinishedReason finishReason);

typedef void(^FocusAreaDidChanged)();

typedef void(^AuthorizationResult)(BOOL success);

@interface WKMovieRecorder : NSObject

+ (WKMovieRecorder*) sharedRecorder;
- (void) setup;
- (void) shutdown;
- (AVCaptureVideoPreviewLayer*) getPreviewLayer;
- (void)prepareCaptureWithBlock:(void (^)())block;
- (void) startCapture;
- (void) pauseCapture;
- (void) stopCapture;
- (void) cancleCaputre;
- (void) resumeCapture;
- (void) startSession;//启动session
- (BOOL) setScaleFactor:(CGFloat)factor;//设置缩放
- (void) changeCamera;
- (void) finishCapture;

//回调
@property (nonatomic, copy) FinishRecordingBlock finishBlock;//录制结束回调
@property (nonatomic, copy) FocusAreaDidChanged focusAreaDidChangedBlock;
@property (nonatomic, copy) AuthorizationResult authorizationResultBlock;

- (instancetype)initWithMaxDuration:(NSTimeInterval)duration;

@property (nonatomic, assign) CGSize cropSize;

@property (nonatomic, strong, readonly) AVCaptureConnection *videoConnection;
@property (nonatomic, strong, readonly) AVCaptureConnection *audioConnection;


@property (nonatomic, strong, readonly) AVCaptureDeviceInput *videoDeviceInput;

@property (nonatomic, assign, readonly) NSTimeInterval duration;

//@property (nonatomic, strong, readonly) UIImage *lastFrame;//最后一帧图片

@property (nonatomic, strong, readonly) NSURL *recordURL;//临时视频地址

- (BOOL)isCapturing;
@end
