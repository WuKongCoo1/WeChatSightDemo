//
//  WKScaleButton.m
//  VideoCaptureDemo
//
//  Created by 吴珂 on 16/5/19.
//  Copyright © 2016年 吴珂. All rights reserved.
//

#import "WKScaleButton.h"

const CGFloat ScaleButtonCircleRadius = 120.f;

#define UIColorFromRGB(rgbValue) [UIColor colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 green:((float)((rgbValue & 0xFF00) >> 8))/255.0 blue:((float)(rgbValue & 0xFF))/255.0 alpha:1.0]

@implementation WKScaleButton
{
    CALayer *_effectiveLayer;
    WKState _state;
    CGFloat _scaleButtonCircleRadius;
}
- (void)awakeFromNib
{
    self.backgroundColor = [UIColor clearColor];
    
    _scaleButtonCircleRadius = (self.bounds.size.width - 10) / 2;
    
    _label = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, self.bounds.size.width, 40)];
    _label.center = CGPointMake(CGRectGetMidX(self.bounds), CGRectGetMidY(self.bounds));
    _label.backgroundColor = [UIColor clearColor];
    _label.textAlignment = NSTextAlignmentCenter;
    _label.text = @"按住拍";
    _label.textColor = [UIColor whiteColor];
    [self addSubview:_label];
    
    _circleLayer = [CAShapeLayer layer];
    _circleLayer.frame = self.bounds;
    UIBezierPath *path = [UIBezierPath bezierPathWithArcCenter:_circleLayer.position radius:_scaleButtonCircleRadius startAngle:-M_PI endAngle:M_PI clockwise:YES];
    _circleLayer.path = path.CGPath;
    _circleLayer.fillColor = [UIColor clearColor].CGColor;
    
    _circleLayer.lineWidth = 3;
    _circleLayer.strokeColor = [UIColor cyanColor].CGColor;

    CALayer *gradientLayer = [CALayer layer];
    CAGradientLayer *gradientLayer1 =  [CAGradientLayer layer];
    gradientLayer1.frame = CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height);
    [gradientLayer1 setColors:[NSArray arrayWithObjects:(id)[[UIColor cyanColor] CGColor],(id)[UIColorFromRGB(0xfde802) CGColor], [UIColor redColor].CGColor, nil]];
    [gradientLayer1 setLocations:@[@0.25, @0.5, @0.75, @1]];
    [gradientLayer1 setStartPoint:CGPointMake(0.5, 1)];
    [gradientLayer1 setEndPoint:CGPointMake(0.5, 0)];
    [gradientLayer addSublayer:gradientLayer1];
    
    [gradientLayer setMask:_circleLayer];
    [self.layer addSublayer:gradientLayer];
    
    UILongPressGestureRecognizer *panGesture = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(panAction:)];
    [self addGestureRecognizer:panGesture];
    panGesture.minimumPressDuration = 0.5;
    
}

- (void)setTitle:(NSString *)title
{
    _label.text = title;
}

- (void)panAction:(UILongPressGestureRecognizer *)ges
{
    
    switch (ges.state) {
            
        case UIGestureRecognizerStateBegan: {
            _state = WKStateIn;
            self.stateChangeBlock(WKStateBegin);
            
            break;
        }
        case UIGestureRecognizerStateChanged: {
            CGPoint point = [ges locationInView:self];
            
            if (![self circleContainsPoint:point]) {
                NSLog(@"out");
                _state = WKStateOut;
                self.stateChangeBlock(WKStateOut);
                
                
                
            } else if ([self circleContainsPoint:point]) {
                
                NSLog(@"in");
                self.stateChangeBlock(WKStateIn);
                _state = WKStateIn;
            }
            break;
        }
        case UIGestureRecognizerStateEnded:
        case UIGestureRecognizerStateCancelled: {
            NSLog(@"cancel, end");
            if(_state == WKStateIn){
               self.stateChangeBlock(WKStateFinish);
            }else{
               self.stateChangeBlock(WKStateCancle);
            }
            break;
        }
        case UIGestureRecognizerStateFailed: {
            NSLog(@"failed");
            self.stateChangeBlock(WKStateCancle);
            break;
        }
        default:
            break;
    }
}


-(void)disappearAnimation{
    CABasicAnimation *animation_scale = [CABasicAnimation animationWithKeyPath:@"transform.scale"];
    animation_scale.toValue = @1.5;
    CABasicAnimation *animation_opacity = [CABasicAnimation animationWithKeyPath:@"opacity"];
    animation_opacity.toValue = @0;
    CAAnimationGroup *aniGroup = [CAAnimationGroup animation];
    aniGroup.duration = 0.2;
    aniGroup.animations = @[animation_scale, animation_opacity];
    aniGroup.fillMode = kCAFillModeForwards;
    aniGroup.removedOnCompletion = NO;
    [_circleLayer addAnimation:aniGroup forKey:@"start"];
    [_label.layer addAnimation:aniGroup forKey:@"start1"];
}

-(void)appearAnimation{
    CABasicAnimation *animation_scale = [CABasicAnimation animationWithKeyPath:@"transform.scale"];
    animation_scale.toValue = @1;
    CABasicAnimation *animation_opacity = [CABasicAnimation animationWithKeyPath:@"opacity"];
    animation_opacity.toValue = @1;
    CAAnimationGroup *aniGroup = [CAAnimationGroup animation];
    aniGroup.duration = 0.2;
    aniGroup.animations = @[animation_scale, animation_opacity];
    aniGroup.fillMode = kCAFillModeForwards;
    aniGroup.removedOnCompletion = NO;
    [_circleLayer addAnimation:aniGroup forKey:@"reset"];
    [_label.layer addAnimation:aniGroup forKey:@"reset1"];
}

- (CGFloat)radius
{
    return _scaleButtonCircleRadius;
}

- (BOOL)circleContainsPoint:(CGPoint)point
{
    CGFloat wh = _scaleButtonCircleRadius * 2;
    CGRect circleRect = CGRectMake((CGRectGetWidth(self.frame) - wh) / 2, (CGRectGetWidth(self.frame) - wh) / 2, wh, wh);
    return CGRectContainsPoint(circleRect, point);
}

@end
