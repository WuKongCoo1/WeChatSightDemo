//
//  WKProgressView.h
//  VideoCaptureDemo
//
//  Created by 吴珂 on 16/5/20.
//  Copyright © 2016年 吴珂. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface WKProgressView : UIView

@property (nonatomic, strong) UIColor *borderColor;
@property (nonatomic, strong) UIColor *progressColor;
@property (nonatomic) float progress;//0~1之间的数
@property (nonatomic) float progressWidth;

- (void)setProgress:(float)progress animated:(BOOL)animated;

@end
