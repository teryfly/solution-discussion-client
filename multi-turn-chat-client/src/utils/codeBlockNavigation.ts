// 代码块键盘导航管理器
export class CodeBlockNavigationManager {
  private static instance: CodeBlockNavigationManager | null = null;
  private saveButtons: HTMLButtonElement[] = [];
  private currentFocusIndex: number = -1;
  private isActive: boolean = false;
  private keyboardHandler: ((e: KeyboardEvent) => void) | null = null;
  static getInstance(): CodeBlockNavigationManager {
    if (!CodeBlockNavigationManager.instance) {
      CodeBlockNavigationManager.instance = new CodeBlockNavigationManager();
    }
    return CodeBlockNavigationManager.instance;
  }
  // 注册保存按钮
  registerSaveButton(button: HTMLButtonElement): void {
    if (!this.saveButtons.includes(button)) {
      this.saveButtons.push(button);
      // 按DOM顺序排序
      this.saveButtons.sort((a, b) => {
        const position = a.compareDocumentPosition(b);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
    }
  }
  // 注销保存按钮
  unregisterSaveButton(button: HTMLButtonElement): void {
    const index = this.saveButtons.indexOf(button);
    if (index !== -1) {
      this.saveButtons.splice(index, 1);
      if (this.currentFocusIndex >= this.saveButtons.length) {
        this.currentFocusIndex = this.saveButtons.length - 1;
      }
    }
  }
  // 激活键盘导航
  activateNavigation(clickedButton: HTMLButtonElement): void {
    this.isActive = true;
    this.currentFocusIndex = this.saveButtons.indexOf(clickedButton);
    if (this.currentFocusIndex === -1) {
      this.registerSaveButton(clickedButton);
      this.currentFocusIndex = this.saveButtons.indexOf(clickedButton);
    }
    this.updateFocus();
    this.attachKeyboardListener();
  }
  // 停用键盘导航
  deactivateNavigation(): void {
    this.isActive = false;
    this.currentFocusIndex = -1;
    this.clearFocus();
    this.detachKeyboardListener();
  }
  // 更新焦点显示
  private updateFocus(): void {
    this.clearFocus();
    if (this.currentFocusIndex >= 0 && this.currentFocusIndex < this.saveButtons.length) {
      const button = this.saveButtons[this.currentFocusIndex];
      button.focus();
      button.style.outline = '2px solid #1a73e8';
      button.style.outlineOffset = '2px';
    }
  }
  // 清除所有焦点样式
  private clearFocus(): void {
    this.saveButtons.forEach(button => {
      button.style.outline = '';
      button.style.outlineOffset = '';
    });
  }
  // 附加键盘监听器
  private attachKeyboardListener(): void {
    if (this.keyboardHandler) {
      this.detachKeyboardListener();
    }
    this.keyboardHandler = (e: KeyboardEvent) => {
      if (!this.isActive || this.saveButtons.length === 0) return;
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          this.moveFocus(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.moveFocus(1);
          break;
        case 'Enter':
          e.preventDefault();
          this.triggerCurrentButton();
          break;
        case 'Escape':
          e.preventDefault();
          this.deactivateNavigation();
          break;
      }
    };
    document.addEventListener('keydown', this.keyboardHandler, true);
  }
  // 移除键盘监听器
  private detachKeyboardListener(): void {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler, true);
      this.keyboardHandler = null;
    }
  }
  // 移动焦点
  private moveFocus(direction: number): void {
    if (this.saveButtons.length === 0) return;
    this.currentFocusIndex += direction;
    // 循环导航
    if (this.currentFocusIndex < 0) {
      this.currentFocusIndex = this.saveButtons.length - 1;
    } else if (this.currentFocusIndex >= this.saveButtons.length) {
      this.currentFocusIndex = 0;
    }
    this.updateFocus();
  }
  // 触发当前焦点按钮的点击事件
  private triggerCurrentButton(): void {
    if (this.currentFocusIndex >= 0 && this.currentFocusIndex < this.saveButtons.length) {
      const button = this.saveButtons[this.currentFocusIndex];
      button.click();
    }
  }
  // 清理所有状态（组件卸载时调用）
  cleanup(): void {
    this.deactivateNavigation();
    this.saveButtons = [];
  }
}
// 导出单例实例
export const navigationManager = CodeBlockNavigationManager.getInstance();