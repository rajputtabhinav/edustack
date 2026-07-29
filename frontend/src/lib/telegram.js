export function getTelegramApp() {
  return window.Telegram?.WebApp;
}

export function getTelegramPlatform() {
  return String(getTelegramApp()?.platform || "").toLowerCase();
}

export function isTelegramAndroid() {
  return getTelegramPlatform() === "android";
}

function postTelegramEvent(eventType, eventData) {
  const payload = typeof eventData === "string" ? eventData : JSON.stringify(eventData || {});

  if (window.TelegramWebviewProxy?.postEvent) {
    window.TelegramWebviewProxy.postEvent(eventType, payload);
    return true;
  }

  if (window.external?.notify) {
    window.external.notify(JSON.stringify({ eventType, eventData: payload }));
    return true;
  }

  return false;
}

/** Signed init string from Telegram - required for backend auth */
export function getTelegramInitData() {
  return getTelegramApp()?.initData || "";
}

export function setupTelegramUi() {
  const webApp = getTelegramApp();

  if (!webApp) {
    return;
  }

  webApp.ready();
  webApp.expand();
  webApp.setHeaderColor("#0B0F1A");
  webApp.setBackgroundColor("#0B0F1A");
}

export function triggerImpact(style = "light") {
  getTelegramApp()?.HapticFeedback?.impactOccurred?.(style);
}

export function triggerNotification(type = "success") {
  getTelegramApp()?.HapticFeedback?.notificationOccurred?.(type);
}

export function configureMainButton({ text, isVisible = true, isEnabled = true, isLoading = false, onClick } = {}) {
  const webApp = getTelegramApp();
  const button = webApp?.MainButton;

  if (!button) {
    return () => {};
  }

  if (!isVisible) {
    if (onClick) {
      button.offClick(onClick);
    }
    button.hideProgress();
    button.hide();
    return () => {};
  }

  button.setText(text || "");
  button.enable();
  if (!isEnabled) {
    button.disable();
  }
  if (isLoading) {
    button.showProgress();
  } else {
    button.hideProgress();
  }
  button.show();

  if (onClick) {
    button.offClick(onClick);
    button.onClick(onClick);
  }

  return () => {
    if (onClick) {
      button.offClick(onClick);
    }
    button.hideProgress();
    button.hide();
  };
}

export function configureBackButton({ isVisible, onClick }) {
  const webApp = getTelegramApp();
  const button = webApp?.BackButton;

  if (!button) {
    return () => {};
  }

  if (!isVisible) {
    if (onClick) {
      button.offClick(onClick);
    }
    button.hide();
    return () => {};
  }

  button.show();
  if (onClick) {
    button.offClick(onClick);
    button.onClick(onClick);
  }

  return () => {
    if (onClick) {
      button.offClick(onClick);
    }
    button.hide();
  };
}

export function openExternalUrl(url, options = {}) {
  const webApp = getTelegramApp();

  if (webApp?.openLink) {
    webApp.openLink(url, options);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

export function requestFileDownload({ url, filename }) {
  if (!url || !filename) {
    return false;
  }

  const webApp = getTelegramApp();

  if (typeof webApp?.downloadFile === "function") {
    webApp.downloadFile({ url, file_name: filename });
    return true;
  }

  if (typeof webApp?.requestFileDownload === "function") {
    webApp.requestFileDownload({ url, file_name: filename });
    return true;
  }

  return postTelegramEvent("web_app_request_file_download", {
    url,
    file_name: filename
  });
}

export function downloadFileViaTelegram({ url, filename, fallbackToExternal = true } = {}) {
  const requested = requestFileDownload({ url, filename });

  if (requested) {
    return true;
  }

  if (fallbackToExternal && url) {
    openExternalUrl(url);
    return true;
  }

  return false;
}
