# ポモドーロタイマー

シンプルな集中・休憩タイマーのiOSアプリです。タイマーとセッション履歴は端末内に保存します。

[App Storeで見る](https://apps.apple.com/us/app/%E3%83%9D%E3%83%A2%E3%83%89%E3%83%BC%E3%83%AD%E3%82%BF%E3%82%A4%E3%83%9E%E3%83%BC-%E3%82%B7%E3%83%B3%E3%83%97%E3%83%AB%E3%81%AA%E9%9B%86%E4%B8%AD%E3%82%BF%E3%82%A4%E3%83%9E%E3%83%BC/id6792636926)

## 主な機能

- 集中・休憩タイマーと時間プリセット
- 開始、一時停止、リセット、スキップ
- アプリがバックグラウンドに移動しても、復帰時に残り時間を再計算
- タイマー終了通知
- セッション履歴の端末内保存と今日の実績表示
- 集中後に休憩を自動開始する設定

## 技術構成

- Expo SDK 54 / React Native 0.81 / TypeScript
- React Navigation
- AsyncStorageによる端末内保存
- Expo Notificationsによる通知
- EAS Build / EAS Submit

## 開発環境のセットアップ

Node.jsとnpmを用意し、リポジトリのルートで実行します。

```sh
npm ci
npx expo start
```

Expo Goまたは開発ビルドで実機確認できます。通知の挙動は端末・OS・ビルド方法によって異なるため、リリース前に実機で確認してください。

## iOSのビルドとApp Store提出

このリポジトリにはEASの `development`、`preview`、`production` プロファイルが設定されています。App Store向けのビルドにはEASアカウントと、Apple Developer / App Store Connectでアプリを管理できる権限が必要です。

1. 依存関係をインストールし、EASにログインします。

   ```sh
   npm ci
   npx eas-cli@latest login
   ```

2. `app.json` のアプリ名、バンドルID、EAS project IDが既存アプリの設定と一致していることを確認します。公開済みアプリのバンドルID `com.Kazumax71.pomodoro` は変更しないでください。アプリのバージョンを更新するときは `app.json` の `expo.version` を更新します。ビルド番号は `eas.json` の設定によりEAS側で自動採番されます。

3. iOS本番ビルドを作成します。

   ```sh
   npx eas-cli@latest build --platform ios --profile production
   ```

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
  lib/notifications.ts
  lib/storage.ts
  screens/TimerScreen.tsx
  screens/HistoryScreen.tsx
  types/index.ts
  theme.ts
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
