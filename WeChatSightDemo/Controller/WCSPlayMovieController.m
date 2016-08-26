//
//  WCSPlayMovieController.m
//  WeChatSightDemo
//
//  Created by 吴珂 on 16/8/26.
//  Copyright © 2016年 吴珂. All rights reserved.
//

#import "WCSPlayMovieController.h"
#import "WKMovieRecorder.h"
#import "WKVideoConverter.h"

#define kScreenWidth [UIScreen mainScreen].bounds.size.width
#define kScreenHeight [UIScreen mainScreen].bounds.size.height

@interface WCSPlayMovieController ()
@property (nonatomic, strong) AVPlayer *player;

@property (nonatomic, strong) AVPlayerLayer *playerLayer;
@end

@implementation WCSPlayMovieController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    CGFloat width = kScreenWidth;
    CGFloat Height = width / 4 * 3;
    AVPlayerItem *item = [AVPlayerItem playerItemWithURL:self.movieURL];
    AVPlayer *player = [[AVPlayer alloc] initWithPlayerItem:item];
    AVPlayerLayer *playerLayer = [AVPlayerLayer playerLayerWithPlayer: player];
    playerLayer.videoGravity = AVLayerVideoGravityResizeAspectFill;
    playerLayer.frame = CGRectMake(0, 0, kScreenWidth, Height);
    playerLayer.position = self.view.center;
    [self.view.layer addSublayer: playerLayer];
    [playerLayer setNeedsDisplay];
    [player play];
    self.player = player;
    _playerLayer = playerLayer;
    
    self.view.backgroundColor = [UIColor blackColor];
    __weak typeof(self) weakSelf = self;
    NSNotificationCenter *noteCenter = [NSNotificationCenter defaultCenter];
    [noteCenter addObserverForName:AVPlayerItemDidPlayToEndTimeNotification
                            object:nil
                             queue:nil
                        usingBlock:^(NSNotification *note) {
                            [weakSelf.player seekToTime:kCMTimeZero];
                            [weakSelf.player play];
                        }];

}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    
}


@end
