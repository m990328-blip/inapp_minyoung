// Vercel Serverless Function — Google Gemini API 버전
// 클라이언트는 이 엔드포인트만 호출하고, 실제 Gemini API 키는 여기(서버)에만 존재합니다.
// Vercel 프로젝트 설정 > Environment Variables 에 GEMINI_API_KEY를 등록하세요.
// (키는 https://aistudio.google.com/apikey 에서 신용카드 없이 무료로 발급받을 수 있어요)

const EXTRACTION_PROMPT = `당신은 스크린샷 이미지를 분석해서 정보를 추출하고 분류하는 도우미입니다.
이 이미지를 분석해서 아래 JSON 형식으로만 응답하세요. 다른 설명이나 코드블록 표시 없이 순수 JSON만 출력하세요.

{"title": "15자 이내 핵심 요약 제목", "text": "이미지에서 읽을 수 있는 모든 텍스트를 최대한 정확하게 옮겨적은 내용", "category": "todo|receipt|link|contact|schedule|etc 중 하나"}

카테고리 기준:
- todo: 할일, 체크리스트, 메모
- receipt: 영수증, 구매/주문 내역, 결제 정보
- link: 링크, SNS 게시물, 채팅/대화 캡처
- contact: 연락처, 명함, 전화번호/이메일
- schedule: 일정, 예약, 날짜와 시간이 중심인 정보
- etc: 위에 해당하지 않는 경우

이미지에 텍스트가 거의 없다면 text는 보이는 내용을 간단히 설명하세요.`;

const GEMINI_MODEL = 'gemini-2.5-flash';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST 요청만 허용돼요.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: '서버에 GEMINI_API_KEY가 설정되어 있지 않아요. Vercel 프로젝트의 Environment Variables를 확인해주세요.' });
    return;
  }

  const { image_base64 } = req.body || {};
  if (!image_base64) {
    res.status(400).json({ error: 'image_base64가 필요해요.' });
    return;
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { inline_data: { mime_type: 'image/jpeg', data: image_base64 } },
                { text: EXTRACTION_PROMPT },
              ],
            },
          ],
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      if (geminiRes.status === 429) {
        res.status(429).json({ error: '무료 티어 요청 한도를 초과했어요. 잠시 후 다시 시도해주세요.' });
        return;
      }
      res.status(geminiRes.status).json({ error: data?.error?.message || 'Gemini API 오류가 발생했어요.' });
      return;
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    if (!rawText) {
      res.status(502).json({ error: 'Gemini가 빈 응답을 반환했어요. 다시 시도해주세요.' });
      return;
    }

    // 프론트엔드는 기존 Claude 응답 형태({content:[{type:'text', text:...}]})를 그대로 파싱하므로
    // 여기서 같은 모양으로 맞춰서 돌려줍니다. (프론트엔드 코드는 수정할 필요 없음)
    res.status(200).json({ content: [{ type: 'text', text: rawText }] });
  } catch (err) {
    res.status(500).json({ error: err.message || '서버 오류가 발생했어요.' });
  }
};
