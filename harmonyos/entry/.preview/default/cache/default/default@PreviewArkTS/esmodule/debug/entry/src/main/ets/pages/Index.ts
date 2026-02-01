if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Index_Params {
    webController?: webview.WebviewController;
    isPageLoaded?: boolean;
    hasError?: boolean;
    errorMsg?: string;
}
import webview from "@ohos:web.webview";
import hilog from "@ohos:hilog";
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.webController = new webview.WebviewController();
        this.__isPageLoaded = new ObservedPropertySimplePU(false, this, "isPageLoaded");
        this.__hasError = new ObservedPropertySimplePU(false, this, "hasError");
        this.__errorMsg = new ObservedPropertySimplePU('', this, "errorMsg");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Index_Params) {
        if (params.webController !== undefined) {
            this.webController = params.webController;
        }
        if (params.isPageLoaded !== undefined) {
            this.isPageLoaded = params.isPageLoaded;
        }
        if (params.hasError !== undefined) {
            this.hasError = params.hasError;
        }
        if (params.errorMsg !== undefined) {
            this.errorMsg = params.errorMsg;
        }
    }
    updateStateVars(params: Index_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__isPageLoaded.purgeDependencyOnElmtId(rmElmtId);
        this.__hasError.purgeDependencyOnElmtId(rmElmtId);
        this.__errorMsg.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__isPageLoaded.aboutToBeDeleted();
        this.__hasError.aboutToBeDeleted();
        this.__errorMsg.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private webController: webview.WebviewController;
    private __isPageLoaded: ObservedPropertySimplePU<boolean>;
    get isPageLoaded() {
        return this.__isPageLoaded.get();
    }
    set isPageLoaded(newValue: boolean) {
        this.__isPageLoaded.set(newValue);
    }
    private __hasError: ObservedPropertySimplePU<boolean>;
    get hasError() {
        return this.__hasError.get();
    }
    set hasError(newValue: boolean) {
        this.__hasError.set(newValue);
    }
    private __errorMsg: ObservedPropertySimplePU<string>;
    get errorMsg() {
        return this.__errorMsg.get();
    }
    set errorMsg(newValue: string) {
        this.__errorMsg.set(newValue);
    }
    aboutToAppear() {
        webview.WebviewController.setWebDebuggingAccess(true);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
            Stack.debugLine("entry/src/main/ets/pages/Index.ets(17:5)", "entry");
            Stack.width('100%');
            Stack.height('100%');
            Stack.backgroundColor('#f5f7fa');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Web 组件 - 必须作为基础布局
            Web.create({
                src: 'resource://rawfile/index.html',
                controller: this.webController
            });
            Web.debugLine("entry/src/main/ets/pages/Index.ets(19:7)", "entry");
            // Web 组件 - 必须作为基础布局
            Web.width('100%');
            // Web 组件 - 必须作为基础布局
            Web.height('100%');
            // Web 组件 - 必须作为基础布局
            Web.javaScriptAccess(true);
            // Web 组件 - 必须作为基础布局
            Web.fileAccess(true);
            // Web 组件 - 必须作为基础布局
            Web.domStorageAccess(true);
            // Web 组件 - 必须作为基础布局
            Web.onPageBegin((event) => {
                hilog.info(0x0000, 'WebView', 'Page begin: %{public}s', event?.url ?? '');
                this.hasError = false;
            });
            // Web 组件 - 必须作为基础布局
            Web.onPageEnd((event) => {
                hilog.info(0x0000, 'WebView', 'Page end: %{public}s', event?.url ?? '');
                this.isPageLoaded = true;
            });
            // Web 组件 - 必须作为基础布局
            Web.onTitleReceive((event) => {
                hilog.info(0x0000, 'WebView', 'Title: %{public}s', event?.title ?? '');
            });
            // Web 组件 - 必须作为基础布局
            Web.onErrorReceive((event) => {
                const code = event?.error?.getErrorCode?.() ?? -1;
                const desc = event?.error?.toString?.() ?? '';
                hilog.error(0x0000, 'WebView', 'Load error - Code: %{public}d, Desc: %{public}s, Event: %{public}s', code, desc, JSON.stringify(event));
                this.hasError = true;
                // error -6 常见于权限或资源加载问题
                this.errorMsg = code === -6
                    ? '加载失败(-6): 请检查权限或资源路径'
                    : `Error: ${code} ${desc}`;
            });
            // Web 组件 - 必须作为基础布局
            Web.onConsole((event) => {
                hilog.info(0x0000, 'WebView', 'Console: %{public}s', event.message.getMessage());
                return false;
            });
        }, Web);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 加载中占位 - 避免空容器
            if (!this.isPageLoaded && !this.hasError) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Index.ets(57:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('加载中...');
                        Text.debugLine("entry/src/main/ets/pages/Index.ets(58:11)", "entry");
                        Text.fontSize(16);
                        Text.fontColor('#666666');
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            // 错误提示
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 错误提示
            if (this.hasError) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Index.ets(69:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.errorMsg);
                        Text.debugLine("entry/src/main/ets/pages/Index.ets(70:11)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#ff0000');
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Stack.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Index";
    }
}
registerNamedRoute(() => new Index(undefined, {}), "", { bundleName: "com.taskplanner.duration", moduleName: "entry", pagePath: "pages/Index", pageFullPath: "entry/src/main/ets/pages/Index", integratedHsp: "false", moduleType: "followWithHap" });
