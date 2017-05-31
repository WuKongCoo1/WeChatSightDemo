//
//  WKMovieWriter.m
//  CapturePause
//
//  Created by 吴珂 on 16/7/7.
//  Copyright © 2016年 Geraint Davies. All rights reserved.
//


#define SCREEN_WIDTH ([UIScreen mainScreen].bounds.size.width)
#define SCREEN_HEIGHT ([UIScreen mainScreen].bounds.size.height)

#import "WKMovieWriter.h"
#import <UIKit/UIKit.h>

@interface WKMovieWriter ()

@property (nonatomic, strong) AVAssetWriterInput *videoInput;
@property (nonatomic, strong) AVAssetWriterInput *audioInput;
@property (nonatomic, strong) AVAssetWriter *videoWriter;
@property (nonatomic, strong) AVAssetWriterInputPixelBufferAdaptor *adaptor;
@property (nonatomic, assign) CMSampleBufferRef currentbuffer;
@property (nonatomic, assign) CGSize cropSize;

@end

@implementation WKMovieWriter

- (instancetype)initWithURL:(NSURL *)URL
{
    if (self = [super init]) {
        
        _recordingURL = URL;
        
        [self prepareRecording];
        
    }
    
    return self;
}

- (instancetype)initWithURL:(NSURL *)URL cropSize:(CGSize)cropSize
{
    if (self = [super init]) {
        
        _recordingURL = URL;
        
        if (cropSize.width == 0 || cropSize.height == 0) {
            
            _cropSize = [UIScreen mainScreen].bounds.size;
            
        }else{
            
            _cropSize = cropSize;
        }
        
        
        [self prepareRecording];
        
        
        
    }
    
    return self;
}

- (void)setCropSize:(CGSize)size
{
    _cropSize = size;
}

- (void)prepareRecording
{
    //上保险
    NSString *filePath = [[self.videoWriter.outputURL absoluteString] stringByReplacingOccurrencesOfString:@"file://" withString:@""];
    BOOL isDirectory = NO;
    if ([[NSFileManager defaultManager] fileExistsAtPath:filePath isDirectory:&isDirectory]) {
        if ([[NSFileManager defaultManager] removeItemAtURL:self.videoWriter.outputURL error:nil]) {
            NSLog(@"");
        }
    }
    
    //初始化
    NSString *betaCompressionDirectory = [[_recordingURL absoluteString] stringByReplacingOccurrencesOfString:@"file://" withString:@""];
    
    NSError *error = nil;
    
    unlink([betaCompressionDirectory UTF8String]);
    //添加图像输入
    //--------------------------------------------初始化刻录机--------------------------------------------
    self.videoWriter = [[AVAssetWriter alloc] initWithURL:[NSURL fileURLWithPath:betaCompressionDirectory]
                                                 fileType:AVFileTypeMPEG4
                                                    error:&error];
    NSParameterAssert(self.videoWriter);
    
    if(error) NSLog(@"error = %@", [error localizedDescription]);
    //--------------------------------------------------------------------------------------------------
    
    
    
    
    
    //--------------------------------------------初始化图像信息输入参数--------------------------------------------
    NSDictionary *videoSettings;
    
    
    
    if (_cropSize.height == 0 || _cropSize.width == 0) {
        
        _cropSize = [UIScreen mainScreen].bounds.size;
        
    }
    
    //    CGFloat ratio = SCREEN_HEIGHT  / SCREEN_WIDTH;
    //
    //    while (fmodf(_cropSize.width, 16) != 0) {
    //        _cropSize.width ++;
    //    }
    //
    //    _cropSize.height = _cropSize.width * ratio;
    
    
    
    videoSettings = [NSDictionary dictionaryWithObjectsAndKeys:
                     AVVideoCodecH264, AVVideoCodecKey,
                     [NSNumber numberWithInt:_cropSize.width], AVVideoWidthKey,
                     [NSNumber numberWithInt:_cropSize.height], AVVideoHeightKey,
                     AVVideoScalingModeResizeAspectFill,AVVideoScalingModeKey,
                     nil];
    
    
    
    self.videoInput = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo outputSettings:videoSettings];
    NSParameterAssert(self.videoInput);
    self.videoInput.expectsMediaDataInRealTime = YES;
    //--------------------------------------------------------------------------------------------------
    
    
    
    
    
    //--------------------------------------------缓冲区参数设置--------------------------------------------
    NSDictionary *sourcePixelBufferAttributesDictionary = [NSDictionary dictionaryWithObjectsAndKeys:
                                                           [NSNumber numberWithInt:kCVPixelFormatType_32ARGB], kCVPixelBufferPixelFormatTypeKey, nil];
    
    self.adaptor = [AVAssetWriterInputPixelBufferAdaptor assetWriterInputPixelBufferAdaptorWithAssetWriterInput:self.videoInput
                    
                                                                                    sourcePixelBufferAttributes:sourcePixelBufferAttributesDictionary];
    
    NSParameterAssert(self.videoInput);
    
    NSParameterAssert([self.videoWriter canAddInput:self.videoInput]);
    //--------------------------------------------------------------------------------------------------
    
    
    
    //添加音频输入
    
    AudioChannelLayout acl;
    
    bzero( &acl, sizeof(acl));
    
    acl.mChannelLayoutTag = kAudioChannelLayoutTag_Mono;
    
    
    //音频配置
    NSDictionary* audioOutputSettings = nil;
    audioOutputSettings = [ NSDictionary dictionaryWithObjectsAndKeys:
                           
                           [ NSNumber numberWithInt: kAudioFormatMPEG4AAC ], AVFormatIDKey,
                           
                           [ NSNumber numberWithInt:64000], AVEncoderBitRateKey,
                           
                           [ NSNumber numberWithFloat: 44100.0 ], AVSampleRateKey,
                           
                           [ NSNumber numberWithInt: 1 ], AVNumberOfChannelsKey,
                           
                           [ NSData dataWithBytes: &acl length: sizeof( acl ) ], AVChannelLayoutKey,
                           
                           nil ];
    
    
    
    self.audioInput = [AVAssetWriterInput  assetWriterInputWithMediaType: AVMediaTypeAudio
                                                          outputSettings: audioOutputSettings];
    self.audioInput.expectsMediaDataInRealTime = YES;
    
    
    
    //图像和语音输入添加到刻录机
    [self.videoWriter addInput:self.audioInput];
    
    [self.videoWriter addInput:self.videoInput];
    
    switch (self.videoWriter.status) {
        case AVAssetWriterStatusUnknown:{
            [self.videoWriter startWriting];
        }
            
            break;
            
        default:
        {
            
        }
            break;
    }
}

- (void)finishRecording
{
    [self finishRecordingIsCancle:NO];
}

- (void)cancleRecording
{
    [self finishRecordingIsCancle:YES];
}

- (void)finishRecordingIsCancle:(BOOL)isCancle
{
    [self.videoInput markAsFinished];
    
    [self.videoWriter finishWritingWithCompletionHandler:^{
        
        NSLog(@"写完了");
        //        NSURL *destinationURL = [NSURL fileURLWithPath:[self appendDocumentDir:@"test.mp4"]];
        //        NSError *error;
        //        [[NSFileManager defaultManager] copyItemAtURL:self.recordingURL toURL:destinationURL error:&error];
        //
        //        if (error) {
        //            NSLog(@"%@", [error debugDescription]);
        //        }
        
        dispatch_async(dispatch_get_main_queue(), ^{
            
            if([self.delegate respondsToSelector:@selector(movieWriterDidFinishRecording:status:)]){
                [self.delegate movieWriterDidFinishRecording:self status:isCancle];
            }
        });
        
        
        
        
    }];
    
    
}



- (void)appendVideoBuffer:(CMSampleBufferRef)sampleBuffer
{
    if (self.videoWriter.status != AVAssetExportSessionStatusUnknown) {
        [self.videoWriter startSessionAtSourceTime:CMSampleBufferGetPresentationTimeStamp(sampleBuffer)];
        _currentbuffer = sampleBuffer;
        [self.videoInput appendSampleBuffer:sampleBuffer];
    }
}


- (void)appendAudioBuffer:(CMSampleBufferRef)sampleBuffer
{
    
    
    if (self.videoWriter.status != AVAssetExportSessionStatusUnknown) {
        [self.videoWriter startSessionAtSourceTime:CMSampleBufferGetPresentationTimeStamp(sampleBuffer)];
        
        _currentbuffer = sampleBuffer;
        
        [self.audioInput appendSampleBuffer:sampleBuffer];
        
    }
}


- (NSString *)appendDocumentDir:(NSString *)path
{
    NSString *docPath = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES)[0];
    return [docPath stringByAppendingPathComponent:path];
}


- (void)dealloc
{
    NSLog(@"%s", __FUNCTION__);
}
@end