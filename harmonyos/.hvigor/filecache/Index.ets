import webview from '@ohos.web.webview';

@Entry
@Component
struct Index {
  webController: webview.WebviewController = new webview.WebviewController();
  @State webUrl: string = 'resource://rawfile/index.html';

  aboutToAppear() {
    // 加载本地 Web 应用
    // 注意：需要先构建 Web 应用并复制到 rawfile 目录
    console.info('Loading web app from: ' + this.webUrl);
  }

  build() {
    Column() {
      Web({
        src: this.webUrl,
        controller: this.webController
      })
        .width('100%')
        .height('100%')
        .javaScriptAccess(true)
        .fileAccess(true)
        .domStorageAccess(true)
        .onPageBegin((event) => {
          console.info('Page begin: ' + event?.url);
        })
        .onPageEnd((event) => {
          console.info('Page end: ' + event?.url);
        })
        .onTitleReceive((event) => {
          console.info('Title: ' + event?.title);
        })
        .onErrorReceive((event) => {
          console.error('Web error: ' + JSON.stringify(event));
          // 如果加载失败，显示错误信息
          if (event?.error) {
            console.error('Error code: ' + event.error.code);
            console.error('Error description: ' + event.error.description);
          }
        })
        .onConsole((event) => {
          // 输出 Web 控制台日志
          console.info('Web console: ' + event.message.getMessage());
        })
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#f5f7fa')
  }
}
