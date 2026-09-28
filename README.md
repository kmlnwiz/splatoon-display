# STAGE NOW

1112 × 834 の横向きスマートディスプレイ向けに、スプラトゥーン3の現在・次のステージ情報と現在時刻を表示するWebアプリです。データは [Spla3 API](https://spla3.yuu26.com/) を利用し、初回表示時・偶数時間の55分・各ステージの切替時刻に自動更新します。

## ローカル起動

```bash
npm install
npm run dev
```

本番ビルドは `npm run build` です。

## GitHub Pages

`main` ブランチへpushすると、GitHub Actionsが自動でビルドしGitHub Pagesへ公開します。リポジトリの **Settings → Pages → Source** を **GitHub Actions** に設定してください。

## iPadで全画面表示

Safariで公開URLを開き、共有メニューから「ホーム画面に追加」してください。ホーム画面のアイコンから起動すると、横向きの全画面表示になります。

本サイトは非公式のファンメイド表示ツールです。任天堂株式会社とは関係ありません。

ルールおよびオカシラ画像は、MITライセンスで公開されている [Splatoon3.ink](https://github.com/misenhower/splatoon3.ink) のアセットを参照しています。ゲーム由来の画像に関する権利は各権利者に帰属します。
