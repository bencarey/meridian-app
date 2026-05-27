// meridian-cal: EventKit helper — prints "Title|secondsUntil" or "none"
#import <Foundation/Foundation.h>
#import <EventKit/EventKit.h>

int main(void) {
    @autoreleasepool {
        EKEventStore *store = [[EKEventStore alloc] init];
        dispatch_semaphore_t sema = dispatch_semaphore_create(0);

        void (^query)(void) = ^{
            NSDate *now = [NSDate date];
            NSDate *end = [now dateByAddingTimeInterval:86400];
            NSPredicate *pred = [store predicateForEventsWithStartDate:now endDate:end calendars:nil];
            NSArray<EKEvent *> *all = [store eventsMatchingPredicate:pred];
            NSArray<EKEvent *> *upcoming = [all filteredArrayUsingPredicate:
                [NSPredicate predicateWithBlock:^BOOL(EKEvent *e, id _) {
                    return !e.allDay && [e.startDate compare:now] == NSOrderedDescending;
                }]];
            upcoming = [upcoming sortedArrayUsingComparator:^NSComparisonResult(EKEvent *a, EKEvent *b) {
                return [a.startDate compare:b.startDate];
            }];
            if (upcoming.count > 0) {
                EKEvent *next = upcoming[0];
                long secs = (long)[next.startDate timeIntervalSinceDate:now];
                printf("%s|%ld\n", [next.title UTF8String] ?: "Meeting", secs);
            } else {
                printf("none\n");
            }
            dispatch_semaphore_signal(sema);
        };

        if (@available(macOS 14.0, *)) {
            [store requestFullAccessToEventsWithCompletion:^(BOOL granted, NSError *_) {
                if (granted) query(); else { printf("none\n"); dispatch_semaphore_signal(sema); }
            }];
        } else {
            [store requestAccessToEntityType:EKEntityTypeEvent completion:^(BOOL granted, NSError *_) {
                if (granted) query(); else { printf("none\n"); dispatch_semaphore_signal(sema); }
            }];
        }

        dispatch_semaphore_wait(sema, DISPATCH_TIME_FOREVER);
    }
    return 0;
}
