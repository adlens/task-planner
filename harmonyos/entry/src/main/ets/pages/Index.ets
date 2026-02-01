import webview from '@ohos.web.webview';
import hilog from '@ohos.hilog';

@Entry
@Component
struct Index {
  webController: webview.WebviewController = new webview.WebviewController();
  @State isPageLoaded: boolean = false;
  @State hasError: boolean = false;
  @State errorMsg: string = '';

  aboutToAppear() {
    webview.WebviewController.setWebDebuggingAccess(true);
  }

  build() {
    Stack() {
      // Web 组件 - 必须作为基础布局
      Web({
        src: $rawfile('index.html'),
        controller: this.webController
      })
        .width('100%')
        .height('100%')
        .javaScriptAccess(true)
        .fileAccess(true)
        .domStorageAccess(true)
        .onPageBegin((event) => {
          hilog.info(0x0000, 'WebView', 'Page begin: %{public}s', event?.url ?? '');
          this.hasError = false;
        })
        .onPageEnd((event) => {
          hilog.info(0x0000, 'WebView', 'Page end: %{public}s', event?.url ?? '');
          this.isPageLoaded = true;
        })
        .onTitleReceive((event) => {
          hilog.info(0x0000, 'WebView', 'Title: %{public}s', event?.title ?? '');
        })
        .onErrorReceive((event) => {
          const code = event?.error?.getErrorCode?.() ?? -1;
          const desc = event?.error?.toString?.() ?? '';
          hilog.error(0x0000, 'WebView', 'Load error - Code: %{public}d, Desc: %{public}s, Event: %{public}s',
            code, desc, JSON.stringify(event));
          this.hasError = true;
          // error -6 常见于权限或资源加载问题
          this.errorMsg = code === -6
            ? '加载失败(-6): 请检查权限或资源路径'
            : `Error: ${code} ${desc}`;
        })
        .onConsole((event) => {
          hilog.info(0x0000, 'WebView', 'Console: %{public}s', event.message.getMessage());
          return false;
        })

      // 加载中占位 - 避免空容器
      if (!this.isPageLoaded && !this.hasError) {
        Column() {
          Text('加载中...')
            .fontSize(16)
            .fontColor('#666666')
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.Center)
      }

      // 错误提示
      if (this.hasError) {
        Column() {
          Text(this.errorMsg)
            .fontSize(14)
            .fontColor('#ff0000')
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.Center)
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#f5f7fa')
  }
}
