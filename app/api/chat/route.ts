import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// AI Chat Assistant cho SipSmart sử dụng Gemini 2.0 Flash-Lite
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const SYSTEM_PROMPT = `Bạn là AI Assistant thân thiện và chuyên nghiệp của SipSmart - hệ thống mượn trả ly tái sử dụng "Sip Smart" để giảm thiểu rác thải nhựa tại khu vực làng đại học.

## KIẾN THỨC VỀ HỆ THỐNG "SIP SMART"

### 1. Mô hình "Sip Smart" (Hệ thống mượn - trả ly tuần hoàn)
- **Khái niệm**: Đây là mô hình kinh tế tuần hoàn (Circular Economy) quy mô nhỏ tại khu vực làng đại học. Ly dùng nhiều lần được coi là tài sản chung của hệ thống, không thuộc về cá nhân hay quán nước riêng lẻ nào.
- **Đối tượng vận hành**: Một liên minh các quán nước đối tác quanh trường đại học và nhà trường cùng phối hợp.

### 2. Quy trình hoạt động (5 bước)

**Bước 1: Mượn ly**
- Sinh viên đến quán nước bất kỳ trong hệ thống
- Quét mã QR trên Mini App (Zalo/MoMo) để mượn ly tái sử dụng thay vì dùng ly nhựa

**Bước 2: Đặt cọc & Ưu đãi**
- Sinh viên đóng một khoản tiền cọc nhỏ (khoảng 10.000đ - 15.000đ) tích hợp trên App
- Đồng thời, họ nhận ngay ưu đãi giảm giá nước (2.000đ - 5.000đ) vì đã giúp quán tiết kiệm chi phí ly nhựa

**Bước 3: Sử dụng & Nhắc nhở**
- Sinh viên mang nước đi học, đi làm
- Hệ thống sẽ gửi thông báo (Push Notification) qua điện thoại để nhắc nhở lịch trả ly, giải quyết triệt để rào cản "hay quên"

**Bước 4: Trả ly linh hoạt**
- Sinh viên có thể trả ly tại bất kỳ quán nào trong liên minh hoặc các trạm thu gom tự động đặt tại các khu sinh hoạt chung của trường
- Không nhất thiết phải trả tại quán đã mượn

**Bước 5: Hoàn cọc & Tái sử dụng**
- Sau khi trả ly thành công, sinh viên nhận lại tiền cọc vào tài khoản App
- Ly được đưa về khâu tiệt trùng đạt chuẩn để quay lại phục vụ khách hàng mới

### 3. Nguyên lý của mô hình

**Nguyên lý Mạng lưới (Network is King)**: Giá trị của hệ thống nằm ở sự bao phủ. Càng nhiều quán tham gia và nhiều điểm trả ly gần giảng đường, sinh viên càng dễ dàng thực hiện hành vi trả ly.

**Nguyên lý Tiện lợi hóa (Seamless Experience)**: Công nghệ QR và Mini App giúp quy trình diễn ra trong vài giây, không bắt người dùng tải thêm app mới, giúp vượt qua rào cản về sự lười biếng.

**Nguyên lý Niềm tin thị giác (Visual Trust)**: Ly mượn phải được làm từ vật liệu chất lượng cao (nhựa PP chịu nhiệt, sợi tre), thiết kế đẹp và luôn trông sạch sẽ để sinh viên tin tưởng vào quy trình vệ sinh.

### 4. Thông tin về SipSmart App

**Ví điện tử:**
- Mỗi ly cần cọc 10.000đ - 15.000đ (sẽ hoàn lại khi trả)
- Ưu đãi giảm giá: 2.000đ - 5.000đ khi mượn ly

**Green Points & Ranking:**
- Trả đúng hạn: 50 Green Points
- Trả quá hạn: 20 Green Points
- Ranking: 🌱 seed → 🌿 sprout → 🌳 sapling → 🌲 tree → 🌍 forest

**Tác động môi trường:**
- Mỗi ly = giảm 15g nhựa = 450 năm ô nhiễm được ngăn chặn

**Tính năng:**
- Quét QR để mượn/trả ly (có thể quét từ camera hoặc chọn ảnh từ gallery)
- Ví điện tử tích hợp
- Bảng xếp hạng Green Points
- Thông báo nhắc nhở trả ly
- Trả ly linh hoạt tại bất kỳ quán nào trong hệ thống

## NHIỆM VỤ CỦA BẠN

- Hướng dẫn người dùng cách sử dụng ứng dụng chi tiết
- Giải thích về Green Points, ranking system
- Hỗ trợ về ví điện tử, mượn/trả ly
- Tạo động lực sống xanh
- Trả lời bằng tiếng Việt, ngắn gọn, thân thiện, Gen Z-friendly
- Luôn nhấn mạnh tính tiện lợi và lợi ích tức thì của hệ thống

Luôn trả lời ngắn gọn, tích cực, và khuyến khích hành vi sống xanh. Sử dụng emoji phù hợp để tạo không khí thân thiện.`;

export async function POST(request: NextRequest) {
  let message = '';
  let history: any[] = [];

  try {
    const body = await request.json();
    message = body.message || '';
    history = body.history || [];

    if (!message) {
      return NextResponse.json(
        { error: 'Missing message' },
        { status: 400 }
      );
    }
  } catch (parseError) {
    return NextResponse.json({
      response: 'Xin lỗi, dữ liệu không hợp lệ. Vui lòng thử lại.',
    });
  }

  // Nếu không có Gemini API key, dùng fallback responses ngay
  if (!genAI || !process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      response: getFallbackResponse(message),
    });
  }

  // Tạm thời tắt Gemini API vì models không available
  // Chỉ dùng fallback response thông minh
  // TODO: Khi có API key hợp lệ, có thể thử lại với model names đúng
  const USE_GEMINI_API = false; // Set to true khi API key và models đã sẵn sàng

  if (USE_GEMINI_API) {
    // Danh sách models để thử (từ mới nhất đến cũ hơn)
    const modelsToTry = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-pro-latest',
    ];

    // Thử từng model cho đến khi thành công
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
        });

        // Tạo prompt với system context và history
        let prompt = SYSTEM_PROMPT + '\n\n';

        // Thêm lịch sử chat nếu có
        if (history && history.length > 0) {
          prompt += 'Lịch sử cuộc trò chuyện:\n';
          history.slice(-5).forEach((msg: any) => {
            prompt += `${msg.role === 'user' ? 'Người dùng' : 'Assistant'}: ${msg.content}\n`;
          });
          prompt += '\n';
        }

        prompt += `Người dùng hỏi: ${message}\n\nHãy trả lời một cách thân thiện, ngắn gọn và hữu ích.`;

        // Gọi Gemini API với timeout
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 30000)
          ),
        ]) as any;

        const response = result.response;
        const text = response.text() || 'Xin lỗi, tôi không thể trả lời ngay bây giờ.';

        return NextResponse.json({
          response: text,
        });
      } catch (error: unknown) {
        const err = error as Error;
        // Nếu là lỗi quota (429), model không tồn tại (404), hoặc API key không hợp lệ
        const status = (error as any).status;
        const isRecoverableError =
          status === 429 ||
          status === 404 ||
          err.message?.includes('404') ||
          err.message?.includes('not found') ||
          err.message?.includes('API key') ||
          err.message?.includes('quota');

        if (isRecoverableError) {
          // Chỉ log lần đầu, sau đó tiếp tục thử model khác
          if (modelsToTry.indexOf(modelName) === 0) {
            // Chỉ log một lần để tránh spam
          }
          continue;
        }

        // Nếu là lỗi khác (lỗi nghiêm trọng), break và fallback
        break;
      }
    }
  }

  // Dùng fallback response thông minh
  // Fallback response đủ thông minh để xử lý hầu hết các câu hỏi

  return NextResponse.json({
    response: getFallbackResponse(message),
  });
}

// Fallback responses khi không có Gemini API
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Xử lý câu hỏi về quét QR code (ưu tiên cao nhất)
  if (
    lowerMessage.includes('qr') ||
    lowerMessage.includes('quét') ||
    lowerMessage.includes('scan') ||
    lowerMessage.includes('mã') && (lowerMessage.includes('quét') || lowerMessage.includes('qr'))
  ) {
    return '📱 Hướng dẫn quét mã QR:\n\n**Cách 1: Quét bằng camera**\n1. Vào trang "Quét QR" trong app\n2. Nhấn nút "Bắt đầu quét"\n3. Cấp quyền truy cập camera\n4. Đưa camera vào mã QR trên ly\n5. Hệ thống sẽ tự động nhận diện!\n\n**Cách 2: Chọn ảnh từ thư viện**\n1. Vào trang "Quét QR"\n2. Nhấn nút chọn ảnh\n3. Chọn ảnh chứa mã QR từ gallery\n4. Hệ thống sẽ quét mã trong ảnh\n\n**Cách 3: Nhập thủ công**\nNếu camera không hoạt động:\n1. Nhấn nút "Nhập thủ công"\n2. Nhập mã 8 số trên ly\n3. Xác nhận\n\n💡 Lưu ý: Mã QR trên ly có format "CUP|{8 số}|{loại ly}|SipSmart"';
  }

  if (lowerMessage.includes('mượn') || lowerMessage.includes('borrow')) {
    return 'Để mượn ly theo mô hình "Sip Smart":\n\n1. Đến quán nước bất kỳ trong hệ thống\n2. Vào trang "Quét QR" (có thể quét bằng camera hoặc chọn ảnh từ gallery)\n3. Quét mã QR trên ly\n4. Xác nhận mượn\n\n💰 Tiền cọc: 10.000đ - 15.000đ (sẽ hoàn lại khi trả)\n🎁 Ưu đãi: Giảm 2.000đ - 5.000đ ngay khi mượn!\n\nLưu ý: Cần có đủ tiền trong ví để làm cọc. Tiền cọc sẽ được hoàn lại khi bạn trả ly! 🌱';
  }

  if (lowerMessage.includes('trả') || lowerMessage.includes('return')) {
    return 'Để trả ly theo mô hình "Sip Smart":\n\n1. Vào trang "Quét QR" (có thể quét bằng camera hoặc chọn ảnh từ gallery)\n2. Quét lại mã QR của ly đang mượn\n3. Chọn cửa hàng trả (có thể trả tại bất kỳ quán nào trong hệ thống, không nhất thiết phải trả tại quán đã mượn)\n4. Xác nhận trả\n\n💡 Mẹo: Trả đúng hạn để nhận 50 Green Points thay vì 20 điểm!\n💰 Tiền cọc sẽ được hoàn lại tự động vào ví của bạn.';
  }

  if (lowerMessage.includes('điểm') || lowerMessage.includes('point') || lowerMessage.includes('green')) {
    return 'Green Points là điểm thưởng khi bạn sống xanh:\n\n✅ Trả ly đúng hạn: +50 điểm\n⚠️ Trả ly quá hạn: +20 điểm\n\nKhi tích lũy đủ điểm, bạn sẽ lên rank:\n🌱 Seed (0 điểm)\n🌿 Sprout (1,000 điểm)\n🌳 Sapling (5,000 điểm)\n🌲 Tree (15,000 điểm)\n🌍 Forest (50,000 điểm)\n\nCàng nhiều điểm, càng nhiều lợi ích! 🏆';
  }

  if (lowerMessage.includes('ví') || lowerMessage.includes('wallet') || lowerMessage.includes('tiền')) {
    return 'Ví điện tử của bạn:\n\n💰 Nạp tiền: Vào trang "Ví điện tử" → Chọn số tiền muốn nạp\n💵 Cọc ly: 10.000đ - 15.000đ/ly (tự động trừ khi mượn)\n💸 Hoàn cọc: Tự động hoàn khi trả ly\n🎁 Ưu đãi: Giảm 2.000đ - 5.000đ khi mượn ly\n\nBạn có thể nạp tiền nhanh với các mức: 50k, 100k, 200k!';
  }

  if (lowerMessage.includes('xếp hạng') || lowerMessage.includes('leaderboard') || lowerMessage.includes('rank')) {
    return 'Bảng xếp hạng giúp bạn thi đua sống xanh với cộng đồng:\n\n🏆 Xem top người dùng có nhiều Green Points nhất\n📊 So sánh với bạn bè\n🎯 Thách thức bản thân lên top\n\nVào trang "Bảng xếp hạng" để xem ngay!';
  }

  if (lowerMessage.includes('môi trường') || lowerMessage.includes('environment') || lowerMessage.includes('nhựa')) {
    return 'Tác động môi trường của bạn:\n\n🌍 Mỗi ly = giảm 15g nhựa\n⏰ Mỗi ly = 450 năm ô nhiễm được ngăn chặn\n📊 Theo dõi số ly đã cứu trên trang chủ\n\nCảm ơn bạn đã góp phần bảo vệ hành tinh! 🌱';
  }

  if (lowerMessage.includes('sip smart') || lowerMessage.includes('mô hình') || lowerMessage.includes('hệ thống')) {
    return 'Mô hình "Sip Smart" là hệ thống mượn-trả ly tuần hoàn:\n\n🔄 Ly là tài sản chung, không thuộc về cá nhân hay quán riêng\n🌐 Trả ly linh hoạt tại bất kỳ quán nào trong hệ thống\n⚡ Quy trình siêu nhanh với QR code\n🎁 Ưu đãi tức thì khi mượn ly\n📱 Thông báo nhắc nhở tự động\n\nThay vì hy vọng bạn thay đổi, hệ thống thay đổi điều kiện xung quanh bạn!';
  }

  return 'Tôi có thể giúp bạn về:\n\n🌱 Cách mượn/trả ly theo mô hình "Sip Smart"\n💰 Quản lý ví điện tử\n🏆 Green Points & Ranking\n📊 Tác động môi trường\n🔄 Nguyên lý hoạt động của hệ thống\n\nBạn muốn biết thêm về điều gì?';
}
