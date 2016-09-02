//
//  WKVideoConverter.m
//  VideoCaptureDemo
//
//  Created by 吴珂 on 16/5/16.
//  Copyright © 2016年 吴珂. All rights reserved.
//

#import "WKVideoConverter.h"
#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <ImageIO/ImageIO.h>
#import <MobileCoreServices/MobileCoreServices.h>


@interface WKGenerateGifImageManager : NSObject

@property (nonatomic, strong) NSOperationQueue *generateQueue;

+ (instancetype)shareInstance;
- (NSOperationQueue *)addOperationWithBlock:(void (^)(void))block;

@end

@implementation WKGenerateGifImageManager

- (instancetype)init
{
    self = [super init];
    if (self) {
        _generateQueue = [[NSOperationQueue alloc] init];
        _generateQueue.maxConcurrentOperationCount = 1;
       
    }
    return self;
}

+ (instancetype)shareInstance
{
    static WKGenerateGifImageManager *manager = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        manager = [[WKGenerateGifImageManager alloc] init];
    });
    
    return manager;
}

- (NSOperation *)addOperationWithBlock:(void (^)(void))block
{
    NSOperation *operation = [NSBlockOperation blockOperationWithBlock:^{
        block();
    }];
    [_generateQueue addOperation:operation];
    
    return operation;
}

@end

typedef NS_ENUM(NSInteger, WKConvertType) {
    WKConvertTypeImage,
    WKConvertTypeImages
};

typedef id (^HandleBlcok)(AVAssetReaderTrackOutput *outPut, AVAssetTrack *videoTrack);

@interface WKVideoConverter ()

@property (nonatomic, strong) AVAssetReader *reader;

@property (nonatomic, strong) dispatch_semaphore_t semaphore;

@property (nonatomic, assign) NSInteger maxConcurrentNum;

@property (nonatomic, strong) dispatch_queue_t convertQueue;

@end

@implementation WKVideoConverter

- (instancetype)init
{
    self = [super init];
    if (self) {
        _maxConcurrentNum = 2;
    
        [self commonInit];
        
    }
    return self;
}

+ (instancetype)shareInstance
{
    static WKVideoConverter *instance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        if (instance == nil) {
            instance = [[WKVideoConverter alloc] init];
        }
    });
    return instance;
}

- (void)commonInit
{
    _semaphore = dispatch_semaphore_create(_maxConcurrentNum);
    _convertQueue = dispatch_queue_create("wkConverter queue", DISPATCH_CURRENT_QUEUE_LABEL);
}

- (void)convertVideoToImagesWithURL:(NSURL *)url finishBlock:(void (^)(id))finishBlock
{
    [self convertVideoFirstFrameWithURL:url type:WKConvertTypeImages finishBlock:finishBlock];
}

- (void)convertVideoFirstFrameWithURL:(NSURL *)url finishBlock:(void (^)(id))finishBlock
{
//    [self convertVideoFirstFrameWithURL:url type:WKConvertTypeImage finishBlock:finishBlock];
    AVURLAsset* asset = [AVURLAsset URLAssetWithURL:url options:nil];
    AVAssetImageGenerator* imageGenerator = [AVAssetImageGenerator assetImageGeneratorWithAsset:asset];
    UIImage* image = [UIImage imageWithCGImage:[imageGenerator copyCGImageAtTime:CMTimeMake(0, 1) actualTime:nil error:nil]];
    finishBlock(image);
}

- (void)convertVideoFirstFrameWithURL:(NSURL *)url type:(WKConvertType)type finishBlock:(void (^)(id))finishBlock
{
    @autoreleasepool {
        
        AVAsset *asset = [AVAsset assetWithURL:url];
        
        if (![self isKindOfClass:[WKVideoConverter class]]) {
            return;
        }
        __weak typeof(self)weakSelf = self;
        
        dispatch_async(_convertQueue, ^{
            
            dispatch_semaphore_wait(_semaphore, DISPATCH_TIME_FOREVER);
            dispatch_queue_t backgroundQueue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0);
            dispatch_async(backgroundQueue, ^{
                __strong typeof(weakSelf) strongSelf = weakSelf;
                NSError *error = nil;
                strongSelf.reader = [[AVAssetReader alloc] initWithAsset:asset error:&error];
                NSLog(@"");
                
                
                if (error) {
                    NSLog(@"%@", [error localizedDescription]);
                    
                }
                
                NSArray *videoTracks = [asset tracksWithMediaType:AVMediaTypeVideo];
                
                AVAssetTrack *videoTrack =[videoTracks firstObject];
                if (!videoTrack) {
                    return ;
                }
                int m_pixelFormatType;
                //     视频播放时，
                m_pixelFormatType = kCVPixelFormatType_32BGRA;
                // 其他用途，如视频压缩
                //    m_pixelFormatType = kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange;
                
                NSMutableDictionary *options = [NSMutableDictionary dictionary];
                [options setObject:@(m_pixelFormatType) forKey:(id)kCVPixelBufferPixelFormatTypeKey];
                AVAssetReaderTrackOutput *videoReaderOutput = [[AVAssetReaderTrackOutput alloc] initWithTrack:videoTrack outputSettings:options];
                if ([strongSelf.reader canAddOutput:videoReaderOutput]) {
                    [strongSelf.reader addOutput:videoReaderOutput];
                    [strongSelf.reader startReading];
                    
                }
                
                
                HandleBlcok handleBlock = [self handleVideoWithType:type];
                
                id result = handleBlock(videoReaderOutput, videoTrack);
                
                if (finishBlock) {
                    dispatch_async(dispatch_get_main_queue(), ^{
                        finishBlock(result);
                    });
                }
                
                dispatch_semaphore_signal(_semaphore);
            });
        });
    }
    
}

- (HandleBlcok)handleVideoWithType:(WKConvertType)type
{
    
    HandleBlcok block;
    
    switch (type) {
        case WKConvertTypeImage: {
            block = ^(AVAssetReaderOutput *videoReaderOutput, AVAssetTrack *videoTrack){
                UIImage *image;
                // 要确保nominalFrameRate>0，之前出现过android拍的0帧视频
                while ([self.reader status] == AVAssetReaderStatusReading && videoTrack.nominalFrameRate > 0) {
                    // 读取 video sample
                    @autoreleasepool {
                        CMSampleBufferRef videoBuffer = [videoReaderOutput copyNextSampleBuffer];
                        
                        CGImageRef cgimage = [WKVideoConverter convertSamepleBufferRefToCGImage:videoBuffer];
                        
                        
                        
                        if (!(__bridge id)(cgimage))
                        {
                            break;
                        }
                        
                        image = [UIImage imageWithCGImage:cgimage];
                        
                        
                        
                        CGImageRelease(cgimage);
                        if (videoBuffer) {
                            
                            CMSampleBufferInvalidate(videoBuffer);
                            CFRelease(videoBuffer);
                            videoBuffer = NULL;
                        }
                        
                        if (image) {
                            return image;
                        }
                    }
                    
                }
                return [[UIImage alloc] init];
            };
            
            break;
        }
        case WKConvertTypeImages: {//图片
            
            block = ^(AVAssetReaderOutput *videoReaderOutput, AVAssetTrack *videoTrack){
                NSMutableArray *images = [NSMutableArray array];
                CGFloat seconds = CMTimeGetSeconds(videoTrack.timeRange.duration);
                CGFloat totalFrame = videoTrack.nominalFrameRate * seconds;
                NSLog(@"%f", totalFrame);
                
                NSInteger convertedCount = 0;
                while ([self.reader status] == AVAssetReaderStatusReading && videoTrack.nominalFrameRate > 0) {
                    // 读取 video sample
                    CMSampleBufferRef videoBuffer = [videoReaderOutput copyNextSampleBuffer];
                    
                    CGImageRef cgimage = [WKVideoConverter convertSamepleBufferRefToCGImage:videoBuffer];
                    
                    
                    
                    if (!(__bridge id)(cgimage))
                    {
                        break;
                    }
                    
                    [images addObject:((__bridge id)(cgimage))];
                    
                    CGImageRelease(cgimage);
                    if (videoBuffer) {
                        
                        CMSampleBufferInvalidate(videoBuffer);
                        CFRelease(videoBuffer);
                        videoBuffer = NULL;
                    }
                    // 根据需要休眠一段时间；比如上层播放视频时每帧之间是有间隔的,这里的 sampleInternal 我设置为0.001秒
                    [NSThread sleepForTimeInterval:0.001];
                    
                    CGFloat progress = ++convertedCount / totalFrame;
                    
                    NSLog(@"process : %f", progress);
                    
                    if ([self.delegate respondsToSelector:@selector(videoConverter:progress:)]) {
                        dispatch_async(dispatch_get_main_queue(), ^{
                            
                            [self.delegate videoConverter:self progress:progress];
                            
                        });
                    }
                    
                    if (fmodf(progress, 1.f) == 0.f) {
                        if ([self.delegate respondsToSelector:@selector(videoConverterFinishConvert:)]) {
                            [self.delegate videoConverterFinishConvert:self];
                        }
                    }
                    
                    
                    if (self.reader.status == AVAssetReaderStatusCompleted) {
                        break;
                    }
                }
                
                return images;
            };
        }
    }
    
    
    return block;
}



//转成UIImage
- (void)convertVideoUIImagesWithURL:(NSURL *)url finishBlock:(void (^)(id images, NSTimeInterval duration))finishBlock
{
        AVAsset *asset = [AVAsset assetWithURL:url];
        NSError *error = nil;
        self.reader = [[AVAssetReader alloc] initWithAsset:asset error:&error];
        
        NSTimeInterval duration = CMTimeGetSeconds(asset.duration);
        __weak typeof(self)weakSelf = self;
        dispatch_queue_t backgroundQueue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0);
        dispatch_async(backgroundQueue, ^{
            __strong typeof(weakSelf) strongSelf = weakSelf;
            NSLog(@"");
            
            
            if (error) {
                NSLog(@"%@", [error localizedDescription]);
                
            }
            
            NSArray *videoTracks = [asset tracksWithMediaType:AVMediaTypeVideo];
            
            AVAssetTrack *videoTrack =[videoTracks firstObject];
            if (!videoTrack) {
                return ;
            }
            int m_pixelFormatType;
            //     视频播放时，
            m_pixelFormatType = kCVPixelFormatType_32BGRA;
            // 其他用途，如视频压缩
            //    m_pixelFormatType = kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange;
            
            NSMutableDictionary *options = [NSMutableDictionary dictionary];
            [options setObject:@(m_pixelFormatType) forKey:(id)kCVPixelBufferPixelFormatTypeKey];
            AVAssetReaderTrackOutput *videoReaderOutput = [[AVAssetReaderTrackOutput alloc] initWithTrack:videoTrack outputSettings:options];
            
            if ([strongSelf.reader canAddOutput:videoReaderOutput]) {
                
                [strongSelf.reader addOutput:videoReaderOutput];
            }
            [strongSelf.reader startReading];
            
            
            NSMutableArray *images = [NSMutableArray array];
            // 要确保nominalFrameRate>0，之前出现过android拍的0帧视频
            while ([strongSelf.reader status] == AVAssetReaderStatusReading && videoTrack.nominalFrameRate > 0) {
                 @autoreleasepool {
                    // 读取 video sample
                    CMSampleBufferRef videoBuffer = [videoReaderOutput copyNextSampleBuffer];
                    
                    if (!videoBuffer) {
                        break;
                    }
                    
                    [images addObject:[WKVideoConverter convertSampleBufferRefToUIImage:videoBuffer]];
                    
                    CFRelease(videoBuffer);
                 }
            
            
         }
            if (finishBlock) {
                dispatch_async(dispatch_get_main_queue(), ^{
                    finishBlock(images, duration);
                });
            }
        });
   

}

- (void)convertVideoToGifImageWithURL:(NSURL *)url destinationUrl:(NSURL *)destinationUrl finishBlock:(void (^)(void))finishBlock
{
    NSLog(@"");
    [self convertVideoUIImagesWithURL:url finishBlock:^(NSArray *images, NSTimeInterval duration) {
        NSLog(@"%p", images);
        [[WKGenerateGifImageManager shareInstance] addOperationWithBlock:^{
            makeAnimatedGif(images, destinationUrl, duration);
            dispatch_async(dispatch_get_main_queue(), ^{
                
                finishBlock();
            });
        }];
    }];
}

// Create a UIImage from sample buffer data
// 官方回答 https://developer.apple.com/library/ios/qa/qa1702/_index.html
+ (CGImageRef)convertSamepleBufferRefToCGImage:(CMSampleBufferRef)sampleBufferRef
{
    @autoreleasepool {
        
        // Get a CMSampleBuffer's Core Video image buffer for the media data
        CVImageBufferRef imageBuffer = CMSampleBufferGetImageBuffer(sampleBufferRef);
        // Lock the base address of the pixel buffer
        CVPixelBufferLockBaseAddress(imageBuffer, 0);
        
        // Get the number of bytes per row for the pixel buffer
        void *baseAddress = CVPixelBufferGetBaseAddress(imageBuffer);
        
        // Get the number of bytes per row for the pixel buffer
        size_t bytesPerRow = CVPixelBufferGetBytesPerRow(imageBuffer);
        // Get the pixel buffer width and height
        size_t width = CVPixelBufferGetWidth(imageBuffer);
        size_t height = CVPixelBufferGetHeight(imageBuffer);
        
        // Create a device-dependent RGB color space
        CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
        
        // Create a bitmap graphics context with the sample buffer data
        CGContextRef context = CGBitmapContextCreate(baseAddress, width, height, 8,
                                                     bytesPerRow, colorSpace, kCGBitmapByteOrder32Little | kCGImageAlphaPremultipliedFirst);
        // Create a Quartz image from the pixel data in the bitmap graphics context
        CGImageRef quartzImage = CGBitmapContextCreateImage(context);
        // Unlock the pixel buffer
        CVPixelBufferUnlockBaseAddress(imageBuffer,0);
        
        // Free up the context and color space
        CGContextRelease(context);
        CGColorSpaceRelease(colorSpace);
        
        return quartzImage;
    }
    
}

+ (UIImage *)convertSampleBufferRefToUIImage:(CMSampleBufferRef)sampleBufferRef
{
    @autoreleasepool {
        
        CGImageRef cgImage = [self convertSamepleBufferRefToCGImage:sampleBufferRef];
        UIImage *image;
        //    image = [UIImage imageWithCGImage:cgImage];
        //    CGImageRelease(cgImage);
        
        CGFloat height = CGImageGetHeight(cgImage);
        CGFloat width = CGImageGetWidth(cgImage);
        
        height = height / 5;
        width = width / 5;
//        UIGraphicsBeginImageContext(CGSizeMake(width, height));
        UIGraphicsBeginImageContextWithOptions(CGSizeMake(width, height), NO, [UIScreen mainScreen].scale);
        
#define UseUIImage 0
#if UseUIImage
        
        [image drawInRect:CGRectMake(0, 0, width, height)];
#else
        
        CGContextRef context = UIGraphicsGetCurrentContext();
        CGContextTranslateCTM(context, 0, height);
        CGContextScaleCTM(context, 1.0, -1.0);
        CGContextDrawImage(context, CGRectMake(0, 0, width, height), cgImage);
        
        
        
#endif
        image = UIGraphicsGetImageFromCurrentImageContext();
        
        UIGraphicsEndImageContext();
        
        CGImageRelease(cgImage);
        
        NSData *imageData = UIImageJPEGRepresentation(image, 0.5);
        UIGraphicsEndImageContext();
        return image;
    }
}

+ (CGSize)compressSize:(CGSize)originalSize targetSize:(CGSize)targetSize
{
    float actualHeight = originalSize.height;
    float actualWidth = originalSize.width;
    float maxHeight = targetSize.height;
    float maxWidth = targetSize.width;
    float imgRatio = actualWidth/actualHeight;
    float maxRatio = maxWidth/maxHeight;
    //    float compressionQuality = 0.5;//50 percent compression
    
    if (actualHeight > maxHeight || actualWidth > maxWidth)
    {
        if(imgRatio < maxRatio)
        {
            //adjust width according to maxHeight
            imgRatio = maxHeight / actualHeight;
            actualWidth = imgRatio * actualWidth;
            actualHeight = maxHeight;
        }
        else if(imgRatio > maxRatio)
        {
            //adjust height according to maxWidth
            imgRatio = maxWidth / actualWidth;
            actualHeight = imgRatio * actualHeight;
            actualWidth = maxWidth;
        }
        else
        {
            actualHeight = maxHeight;
            actualWidth = maxWidth;
        }
    }
    
    return CGSizeMake(actualWidth, actualHeight);
}


static void makeAnimatedGif(NSArray *images, NSURL *gifURL, NSTimeInterval duration) {
    NSTimeInterval perSecond = duration /images.count;
    
    NSDictionary *fileProperties = @{
                                     (__bridge id)kCGImagePropertyGIFDictionary: @{
                                             (__bridge id)kCGImagePropertyGIFLoopCount: @0, // 0 means loop forever
                                             }
                                     };
    
    NSDictionary *frameProperties = @{
                                      (__bridge id)kCGImagePropertyGIFDictionary: @{
                                              (__bridge id)kCGImagePropertyGIFDelayTime: @(perSecond), // a float (not double!) in seconds, rounded to centiseconds in the GIF data
                                              }
                                      };
    
    //    NSURL *documentsDirectoryURL = [[NSFileManager defaultManager] URLForDirectory:NSDocumentDirectory inDomain:NSUserDomainMask appropriateForURL:nil create:YES error:nil];
    //    NSURL *fileURL = [documentsDirectoryURL URLByAppendingPathComponent:@"animated.gif"];
    
    CGImageDestinationRef destination = CGImageDestinationCreateWithURL((__bridge CFURLRef)gifURL, kUTTypeGIF, images.count, NULL);
    CGImageDestinationSetProperties(destination, (__bridge CFDictionaryRef)fileProperties);
    
    for (UIImage *image in images) {
        @autoreleasepool {
            
            CGImageDestinationAddImage(destination, image.CGImage, (__bridge CFDictionaryRef)frameProperties);
        }
    }
    
    if (!CGImageDestinationFinalize(destination)) {
        NSLog(@"failed to finalize image destination");
    }else{
        
        
    }
    CFRelease(destination);
    
    
}

- (void)dealloc
{
    NSLog(@"%s", __FUNCTION__);
}

@end
