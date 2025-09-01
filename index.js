require("dotenv").config();
const axios = require("axios");

const API_KEY = process.env.UPTIMEROBOT_API_KEY;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

// Lưu trạng thái cũ để so sánh
let lastStatus = {};

// Gửi thông báo lên Discord
async function sendDiscordNotification(message) {
  if (!DISCORD_WEBHOOK) return;
  try {
    await axios.post(DISCORD_WEBHOOK, { content: message });
    console.log("✅ Đã gửi thông báo lên Discord");
  } catch (err) {
    console.error("❌ Lỗi khi gửi Discord:", err.message);
  }
}

// Lấy dữ liệu monitors từ UptimeRobot
async function getMonitors() {
  try {
    const res = await axios.post("https://api.uptimerobot.com/v2/getMonitors", {
      api_key: API_KEY,
      format: "json",
    });
    return res.data.monitors || [];
  } catch (err) {
    console.error("❌ Error fetching monitors:", err.message);
    return [];
  }
}

// Kiểm tra tình trạng server
async function checkServers() {
  console.log(`[${new Date().toLocaleString()}] 🔍 Kiểm tra monitors...`);
  const monitors = await getMonitors();

  monitors.forEach((m) => {
    const status = m.status; // 2 = online, 9/0/... = offline
    const prevStatus = lastStatus[m.id];
    const now = new Date().toLocaleString("vi-VN");

    if (status !== prevStatus) {
      if (status === 2) {
      sendDiscordNotification(
      `📊 TÌNH TRẠNG DỊCH VỤ\n\n🟢 Server **${m.friendly_name}** (${m.url}:${m.port || 45014}) đã HOẠT ĐỘNG trở lại 🚀\n\n🕒 Cập nhật lần cuối: ${now}\n\nPowered by UptimeRobot – NodeJS`
      );
    } else {
      sendDiscordNotification(
      `📊 TÌNH TRẠNG DỊCH VỤ\n\n🔴 Server **${m.friendly_name}** (${m.url}:${m.port || 45014}) đang NGỪNG HOẠT ĐỘNG ❌\n\n🕒 Cập nhật lần cuối: ${now}\n\nPowered by UptimeRobot – NodeJS`
      );
    }
      lastStatus[m.id] = status; // cập nhật trạng thái
    }
  });
}

// Kiểm tra mỗi 5 phút
checkServers(); // chạy lần đầu
setInterval(checkServers, 5 * 60 * 1000);

console.log(
  `[${new Date().toLocaleString()}] ⏱ Sẽ kiểm tra mỗi 5 phút (300000 ms).`
);
