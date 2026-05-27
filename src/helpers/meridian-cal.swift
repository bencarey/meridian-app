import Foundation
import EventKit

let store = EKEventStore()
let sema = DispatchSemaphore(value: 0)

func queryEvents() {
    let now = Date()
    let end = now.addingTimeInterval(86400) // next 24 hours
    let pred = store.predicateForEvents(withStart: now, end: end, calendars: nil)
    let events = store.events(matching: pred)
        .filter { !$0.isAllDay && $0.startDate > now }
        .sorted { $0.startDate < $1.startDate }
    if let e = events.first {
        let secs = Int(e.startDate.timeIntervalSince(now))
        print("\(e.title ?? "Meeting")|\(secs)")
    } else {
        print("none")
    }
    sema.signal()
}

if #available(macOS 14.0, *) {
    store.requestFullAccessToEvents { granted, _ in
        if granted { queryEvents() } else { print("none"); sema.signal() }
    }
} else {
    store.requestAccess(to: .event) { granted, _ in
        if granted { queryEvents() } else { print("none"); sema.signal() }
    }
}

sema.wait()
