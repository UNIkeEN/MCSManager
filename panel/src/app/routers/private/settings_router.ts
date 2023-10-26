import Router from "@koa/router";
import remoteService from "../../service/system_remote_service";
import { setImmediate } from "timers";
import permission from "../../middleware/permission";
import validator from "../../middleware/validator";
import { saveSystemConfig, systemConfig } from "../../setting";
import { logger } from "../../service/log";
import { i18next } from "../../i18n";
import userSystem from "../../service/system_user";
import * as fs from "fs-extra";
import path from "path";

const router = new Router({ prefix: "/overview" });
const LAYOUT_CONFIG_PATH = path.normalize(path.join(process.cwd(), "data", "layout.json"));

// [Top-level Permission]
// Get panel configuration items
router.get("/setting", permission({ level: 10 }), async (ctx) => {
  ctx.body = systemConfig;
});

// [Top-level Permission]
// Update panel configuration items
router.put("/setting", validator({ body: {} }), permission({ level: 10 }), async (ctx) => {
  const config = ctx.request.body;
  if (config) {
    if (config.httpIp != null) systemConfig.httpIp = config.httpIp;
    if (config.httpPort != null) systemConfig.httpPort = config.httpPort;
    if (config.crossDomain != null) systemConfig.crossDomain = config.crossDomain;
    if (config.gzip != null) systemConfig.gzip = config.gzip;
    if (config.maxCompress != null) systemConfig.maxCompress = config.maxCompress;
    if (config.maxDownload != null) systemConfig.maxDownload = config.maxDownload;
    if (config.zipType != null) systemConfig.zipType = config.zipType;
    if (config.loginCheckIp != null) systemConfig.loginCheckIp = config.loginCheckIp;
    if (config.forwardType != null) systemConfig.forwardType = Number(config.forwardType);
    if (config.dataPort != null) systemConfig.dataPort = Number(config.dataPort);
    if (config.loginInfo != null) systemConfig.loginInfo = String(config.loginInfo);
    if (config.canFileManager != null) systemConfig.canFileManager = Boolean(config.canFileManager);
    if (config.quickInstallAddr != null)
      systemConfig.quickInstallAddr = String(config.quickInstallAddr);
    if (config.language != null) {
      logger.warn("Language change:", config.language);
      systemConfig.language = String(config.language);
      i18next.changeLanguage(systemConfig.language);
      remoteService.changeDaemonLanguage(systemConfig.language);
    }
    saveSystemConfig(systemConfig);
    ctx.body = "OK";
    return;
  }
  ctx.body = new Error("The body is incorrect");
});

// [Public Permission]
// Update config when install
router.put("/install", async (ctx) => {
  const config = ctx.request.body;
  if (userSystem.objects.size === 0) {
    if (config.language != null) {
      logger.warn("Language change:", config.language);
      systemConfig.language = String(config.language);
      i18next.changeLanguage(systemConfig.language);
      remoteService.changeDaemonLanguage(systemConfig.language);
    }
    saveSystemConfig(systemConfig);
    ctx.body = "OK";
    return;
  }
  ctx.body = new Error("The MCSManager has been installed");
});

router.get("/layout", permission({ level: 1 }), async (ctx) => {
  const layoutConfig = fs.readFileSync(LAYOUT_CONFIG_PATH, "utf-8");
  ctx.body = layoutConfig;
});

router.post("/layout", permission({ level: 10 }), async (ctx) => {
  const config = ctx.request.body;
  fs.writeFileSync(LAYOUT_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
  ctx.body = true;
});

export default router;
