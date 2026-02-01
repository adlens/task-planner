struct preview{build(){Web({
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
        })}}