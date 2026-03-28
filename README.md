# 确定性密码生成器 (Deterministic Vault) v4.5

基于 HMAC-SHA256 的无状态、安全的客户端确定性密码生成器。

## 🌟 核心理念

**“只需记住一个主密钥，即可遗忘所有网站的复杂密码。”**

本应用不将您的主密钥或生成的密码上传到任何云端服务器。所有的密码计算都在您的本地浏览器中离线完成。只要您输入相同的“主密钥”和“账户标识”，系统每次都会通过加密算法（HMAC-SHA256）为您生成完全相同的高强度密码。

## ✨ 主要功能

- 🔒 **完全离线计算**：无后端服务器，无云端存储，拒绝数据泄露风险。
- 🔑 **确定性生成算法**：基于 HMAC-SHA256，保证相同输入必定得到相同输出。
- 📱 **本地密码库**：可将账号标识安全保存在本地浏览器缓存中（不保存主密钥），方便随时查看和生成。
- 🎨 **自定义图标**：支持为不同的账号设置专属的文字图标和颜色。
- 📁 **数据导入导出**：支持将本地密码库导出为 CSV 文件进行备份，或从 CSV 文件导入记录。
- 🛡️ **防暴力破解机制**：密码库解锁失败 5 次将自动销毁本地库数据，保护隐私。

## 🚀 快速开始 (Web 端开发)

本项目使用 React + Vite + Tailwind CSS 构建。

### 安装依赖
```bash
npm install
```

### 本地运行
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 📦 打包为 Android APK

如果您希望将此 Web 应用打包为 Android APK，推荐使用 **Capacitor** 或 **Cordova**。以下是使用 Capacitor 的简要步骤：

1. **安装 Capacitor 依赖**：
   ```bash
   npm install @capacitor/core @capacitor/android
   npm install -D @capacitor/cli
   ```
2. **初始化 Capacitor**：
   ```bash
   npx cap init "Deterministic Vault" "com.yourname.vault" --web-dir dist
   ```
3. **构建 Web 项目**：
   ```bash
   npm run build
   ```
4. **添加 Android 平台并同步代码**：
   ```bash
   npx cap add android
   npx cap sync android
   ```
5. **在 Android Studio 中打开并打包**：
   ```bash
   npx cap open android
   ```
   在 Android Studio 中，您可以生成签名 APK (Build -> Generate Signed Bundle / APK)。

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。您可以自由地使用、修改和分发本代码，但请保留原作者的版权声明。

## ⚠️ 安全免责声明

本工具旨在提供一种便捷且相对安全的密码管理方式。虽然计算过程完全在本地进行，但请务必：
1. **妥善保管您的主密钥**：一旦遗忘，您将无法找回任何密码。
2. **保护您的设备安全**：确保您的手机或电脑未感染恶意软件（如键盘记录器）。
3. **定期备份**：由于数据存储在浏览器本地，清除缓存会导致数据丢失，请定期使用 CSV 导出功能进行备份。
