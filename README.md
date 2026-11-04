# ポモドーロタイマー

シンプルな集中・休憩タイマーのiOSアプリです。タイマーとセッション履歴は端末内に保存します。

[App Storeで見る](https://apps.apple.com/us/app/%E3%83%9D%E3%83%A2%E3%83%89%E3%83%BC%E3%83%AD%E3%82%BF%E3%82%A4%E3%83%9E%E3%83%BC-%E3%82%B7%E3%83%B3%E3%83%97%E3%83%AB%E3%81%AA%E9%9B%86%E4%B8%AD%E3%82%BF%E3%82%A4%E3%83%9E%E3%83%BC/id6792636926)

## 主な機能

- 集中・休憩タイマーと時間プリセット
- 開始、一時停止、リセット、スキップ
- 終了時刻に合わせた集中・休憩の通知と、やさしいオリジナルチャイム
- iOSのロック画面とDynamic Islandに残り時間を表示（Live Activity対応端末）
- 日本語・英語表示と端末言語への自動追従
- 今日の記録と、曜日別グラフを含む週間レビュー
- セッション履歴の端末内保存
- 集中後に休憩を自動開始する設定
- クリーム色とテラコッタを基調にしたライトテーマ

## 技術構成

- Expo SDK 56 / React Native 0.85 / TypeScript
- React Navigation
- AsyncStorageによる端末内保存
- Expo Notificationsによる通知
- Expo Widgets / SwiftUIによるiOS Live Activity
- Expo Localizationによる端末言語判定
- EAS Build / EAS Submit

## 開発環境のセットアップ

Node.jsとnpmを用意し、リポジトリのルートで実行します。

```sh
npm ci
npx expo start
```

通常の画面はExpo Goまたは開発ビルドで確認できます。Live Activityとカスタム通知音はネイティブ機能を含むため、Expo GoではなくEAS開発ビルドを使い、iOS実機で確認してください。Live ActivityはiOS 16.1以降の機能ですが、このExpo SDKのiOS最低対応バージョンは16.4です。この更新後はiOS 16.4未満の端末にアプリをインストールできなくなります。

通知を許可し、タイマーを開始すると終了予定時刻に通知が予約されます。一時停止・リセット・スキップでは予約を取り消します。OSの通知設定、集中モード、端末の消音設定によって、通知の表示や音量は変わることがあります。

## iOSのビルドとApp Store提出

このリポジトリにはEASの `development`、`preview`、`production` プロファイルが設定されています。App Store向けのビルドにはEASアカウントと、Apple Developer / App Store Connectでアプリを管理できる権限が必要です。

1. 依存関係をインストールし、EASにログインします。

   ```sh
   npm ci
   npx eas-cli@latest login
   ```

   PRと同じTypeScript・Expo設定チェックをローカルで実行するには、次のコマンドを使います。

   ```sh
   npx tsc --noEmit
   npx expo config --type public
   ```

2. `app.json` のアプリ名、バンドルID、EAS project IDが既存アプリの設定と一致していることを確認します。公開済みアプリのバンドルID `com.Kazumax71.pomodoro` は変更しないでください。アプリのバージョンを更新するときは `app.json` の `expo.version` を更新します。ビルド番号は `eas.json` の設定によりEAS側で自動採番されます。

3. iOS本番ビルドを作成します。

   ```sh
   npx eas-cli@latest build --platform ios --profile production
   ```

   Live Activityや通知音などのネイティブ設定を含むため、新しいバイナリのビルドが必要です。先に開発ビルドで実機確認する場合は、次を実行してください。

   ```sh
   npx eas-cli@latest build --platform ios --profile development
   ```

   実機確認後に本番ビルドを作成してください。App Store Connectへの提出と公開は手動で行います。

4. 完了したビルドをApp Store Connectへアップロードします。

   ```sh
   npx eas-cli@latest submit --platform ios --profile production --latest
   ```

5. App Store Connectでビルドの処理完了を確認し、必要なバージョン情報・審査情報を入力して審査へ提出します。審査通過後の公開タイミングもApp Store Connectで設定します。

EASが初回ビルド・提出時に認証情報や署名資格情報の設定を求めることがあります。秘密鍵、APIキー、パスワードはリポジトリへ追加しないでください。

## プロジェクト構成

```
App.tsx
app.json
eas.json
src/
  hooks/useTimer.ts
  i18n.ts
  lib/liveActivity.ts
  lib/notifications.ts
  lib/storage.ts
  screens/TimerScreen.tsx
  screens/HistoryScreen.tsx
  types/index.ts
  theme.ts
  widgets/FocusLiveActivity.tsx
```

## 設定ファイル

- `app.json`: Expoアプリ設定、iOS/Android識別子、通知・スプラッシュ画面設定
- `eas.json`: EASビルドおよび提出プロファイル
- `src/hooks/useTimer.ts`: タイマー状態と時間計算
- `src/lib/storage.ts`: 設定とセッション履歴の端末内保存
- `src/lib/notifications.ts`: 通知権限とタイマー終了通知

## 参考資料

- [Expo: EAS BuildでiOS本番ビルドを作成](https://docs.expo.dev/tutorial/eas/ios-production-build/)
- [Expo: iOS App Storeへの提出](https://docs.expo.dev/submit/ios/)
- [Expo: eas.jsonの設定](https://docs.expo.dev/build/eas-json/)
