// Make the Live Activity controls update ActivityKit state even when the app is suspended.
const fs = require("node:fs");
const path = require("node:path");

const packagePath = require.resolve("expo-widgets/package.json");
const intentPath = path.join(path.dirname(packagePath), "ios", "Widgets", "AppIntent.swift");
const marker = "// Focus Timer Live Activity controls update content without the app process.";
let source = fs.readFileSync(intentPath, "utf8");

if (source.includes(marker)) {
  process.exit(0);
}

const intentPattern = /@available\(iOS 16\.0, \*\)\s*struct LiveActivityUserInteraction: LiveActivityIntent \{[\s\S]*?\n\}/;
if (!intentPattern.test(source)) {
  throw new Error(`Could not find the expected LiveActivityUserInteraction in ${intentPath}`);
}

if (!source.includes("import ActivityKit")) {
  source = source.replace("import AppIntents", "import ActivityKit\nimport AppIntents");
}

const replacement = `${marker}
@available(iOS 16.2, *)
struct LiveActivityUserInteraction: LiveActivityIntent {
  static var title: LocalizedStringResource = "User Interaction"
  static var isDiscoverable: Bool = false

  @Parameter(title: "source")
  var source: String?

  @Parameter(title: "target")
  var target: String?

  init() {}
  init(source: String?, target: String?) {
    self.source = source
    self.target = target
  }

  func perform() async throws -> some IntentResult {
    if let source,
       source == "FocusActivity",
       let target,
       let activity = Activity<LiveActivityAttributes>.activities.first(where: { $0.content.state.name == source }),
       let state = updatedFocusState(activity.content.state, target: target) {
      await activity.update(ActivityContent(state: state, staleDate: nil))
    }

    WidgetsEvents.shared.sendNotification(type: .userEvent, data: [
      "source": source as Any,
      "target": target as Any,
      "timestamp": Int(Date().timeIntervalSince1970 * 1000)
    ])

    return .result()
  }

  private func updatedFocusState(_ state: LiveActivityAttributes.ContentState, target: String) -> LiveActivityAttributes.ContentState? {
    guard let data = state.props.data(using: .utf8),
          var props = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
      return nil
    }

    let now = Date().timeIntervalSince1970 * 1000
    switch target {
    case "focus-timer-pause":
      guard (props["paused"] as? Bool) != true,
            let endAt = (props["endAt"] as? NSNumber)?.doubleValue else {
        return nil
      }
      let remaining = max(0, Int(ceil((endAt - now) / 1000)))
      props["remainingSeconds"] = remaining
      props["endAt"] = now + Double(remaining) * 1000
      props["paused"] = true
    case "focus-timer-resume":
      guard (props["paused"] as? Bool) == true,
            let remaining = (props["remainingSeconds"] as? NSNumber)?.intValue else {
        return nil
      }
      props["startAt"] = now
      props["endAt"] = now + Double(max(0, remaining)) * 1000
      props["paused"] = false
    default:
      return nil
    }

    guard let updatedData = try? JSONSerialization.data(withJSONObject: props, options: [.sortedKeys]),
          let updatedProps = String(data: updatedData, encoding: .utf8) else {
      return nil
    }
    return LiveActivityAttributes.ContentState(name: state.name, props: updatedProps)
  }
}`;

source = source.replace(intentPattern, replacement);
fs.writeFileSync(intentPath, source);
