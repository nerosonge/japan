const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// 받는 사람 이메일 (배포 시 그대로 사용하거나 환경 변수로 변경)
const TO_EMAIL = process.env.CONTACT_EMAIL || 'spring8rt@gmail.com';

module.exports = async (req, res) => {
  // CORS: 브라우저에서 호출 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  const { name, phone, email } = body || {};
  if (!name || !phone || !email) {
    return res.status(400).json({ error: '이름, 전화번호, 이메일을 모두 입력해 주세요.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY가 설정되지 않았습니다.' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: '일본어 퀴즈 <onboarding@resend.dev>',
      to: [TO_EMAIL],
      replyTo: email,
      subject: '[일본어 퀴즈] 일본인 친구 만나기 문의',
      html: `
        <h2>일본인 친구 만나기 문의</h2>
        <p>아래 정보로 연락해 주세요.</p>
        <ul>
          <li><strong>이름:</strong> ${escapeHtml(name)}</li>
          <li><strong>전화번호:</strong> ${escapeHtml(phone)}</li>
          <li><strong>이메일:</strong> ${escapeHtml(email)}</li>
        </ul>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message || '이메일 전송에 실패했습니다.' });
    }

    return res.status(200).json({ success: true, id: data?.id });
  } catch (err) {
    console.error('Send error:', err);
    return res.status(500).json({ error: '이메일 전송 중 오류가 발생했습니다.' });
  }
};

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}
