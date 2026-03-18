import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface QuickQuestion {
  ar: string;
  fr: string;
}

const QUICK_QUESTIONS: QuickQuestion[] = [
  { ar: 'ما هي إجراءات تأسيس شركة في الجزائر؟', fr: 'Procédures de création d\'entreprise en Algérie?' },
  { ar: 'ما هي شروط الحصول على محامٍ؟', fr: 'Conditions pour obtenir un avocat?' },
  { ar: 'كيف يتم توثيق عقد البيع؟', fr: 'Comment notarier un contrat de vente?' },
  { ar: 'ما هي حقوق المستهلك في القانون الجزائري؟', fr: 'Droits des consommateurs en droit algérien?' },
];

const LEGAL_RESPONSES: Record<string, string> = {
  default: `مرحباً بك في بوت الميزان الذكي 🤖⚖️

أنا مساعدك القانوني الذكي لمنصة Legal Algeria Hub. يمكنني مساعدتك في:

• 📋 **إجراءات تأسيس الشركات** والسجل التجاري
• 📜 **توثيق العقود** والمحررات الرسمية
• ⚖️ **حقوق المتقاضين** وإجراءات التقاضي
• 🏛️ **القانون الجزائري** - المدني، التجاري، الجزائي
• 👨‍💼 **مهنة المحاماة** والتوثيق في الجزائر

اكتب سؤالك وسأجيبك في أقرب وقت!

---
*Bienvenue sur Mizan Bot - Votre assistant juridique algérien*`,

  شركة: `**إجراءات تأسيس شركة في الجزائر** 🏢

**المرحلة 1: التحضير**
1. اختيار الشكل القانوني (SARL، SPA، EURL...)
2. تحديد الاسم التجاري والتحقق من توفره
3. إعداد القانون الأساسي للشركة

**المرحلة 2: لدى الموثق**
- توثيق عقد التأسيس لدى موثق معتمد
- الحصول على نسخ رسمية من القانون الأساسي

**المرحلة 3: الإجراءات الإدارية**
- فتح حساب مصرفي وإيداع رأس المال
- التسجيل في المركز الوطني للسجل التجاري (CNRC)
- الحصول على رقم الضريبة (NIF) من إدارة الضرائب
- التسجيل في الضمان الاجتماعي (CNAS)

**الوثائق المطلوبة:**
• بطاقة هوية وطنية / جواز السفر
• عقد إيجار أو ملكية المقر الاجتماعي
• شهادة السوابق القضائية

⏱️ **المدة:** 7 إلى 15 يوم عمل

---
*📞 للاستشارة: تواصل مع محامٍ أو موثق معتمد*`,

  محامي: `**الحصول على خدمات محامٍ في الجزائر** ⚖️

**حق الاستعانة بمحامٍ:**
وفق القانون الجزائري، لكل مواطن الحق في الاستعانة بمحامٍ في جميع مراحل التقاضي.

**كيفية اختيار محامٍ:**
1. التواصل مع **هيئة المحامين** في دائرة الاختصاص
2. البحث في **قائمة المحامين المعتمدين** لدى المحكمة
3. الاستفسار من **نقابة المحامين** الجزائريين

**المساعدة القضائية:**
في حالة عدم القدرة على تحمل أتعاب المحاماة، يمكن التقدم بطلب **المساعدة القضائية** لدى مكتب المساعدة القضائية بالمحكمة.

**الحقوق الأساسية:**
• حق التمثيل القانوني في كل الإجراءات
• سرية المحادثات بين المحامي وموكله
• الحق في الاطلاع على ملف القضية

---
*Pour plus d'informations: Contactez l'Ordre des Avocats algériens*`,

  عقد: `**توثيق العقود لدى الموثق** 📜

**أنواع العقود التي تستوجب التوثيق:**
• عقود بيع وشراء العقارات
• عقود الهبة والوصية
• عقود الرهن العقاري
• عقود الزواج (الصداق والشروط)
• عقود تأسيس الشركات

**الإجراءات:**
1. **حجز موعد** لدى الموثق المختص بمكان العقار أو المقر
2. **تقديم الوثائق** المطلوبة:
   - بطاقات الهوية لجميع الأطراف
   - وثيقة ملكية العقار (رسم عقاري/رسم بناء)
   - شهادة العبء من مصلحة المحافظة العقارية
3. **دفع الرسوم** الموثقة وضريبة نقل الملكية
4. **توقيع العقد** أمام الموثق والشهود

**التكاليف:**
- أتعاب الموثق (محددة بمرسوم)
- رسوم التسجيل: 5% من قيمة العقار
- رسوم المحافظة العقارية: 1%

---
*⚠️ استشر موثقاً معتمداً قبل توقيع أي عقد*`,

  مستهلك: `**حقوق المستهلك في القانون الجزائري** 🛡️

**القانون المرجعي:** القانون 09-03 المتعلق بحماية المستهلك وقمع الغش

**حقوقك الأساسية كمستهلك:**
1. **حق الإعلام:** الحصول على معلومات صحيحة وكاملة حول المنتجات
2. **حق السلامة:** الحماية من المنتجات الخطيرة
3. **حق الاختيار:** حرية اختيار المنتج والخدمة
4. **حق التقاضي:** تقديم شكاوى واللجوء للقضاء

**في حالة الغش أو التدليس:**
- تقديم شكوى لدى **مديرية التجارة** المختصة
- اللجوء إلى **الجمعيات الحماية المستهلك**
- رفع دعوى قضائية أمام المحاكم المدنية

**العقوبات المقررة للغش:**
الغرامات المالية والسجن حسب خطورة الغش وفق أحكام القانون 09-03

**مراكز الاستشارة:**
• المديريات الولائية للتجارة
• جمعيات حماية المستهلك المعتمدة

---
*للإبلاغ عن مخالفة: اتصل بـ 1033 (مديرية التجارة)*`,
};

function getBotResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes('شركة') || msg.includes('تأسيس') || msg.includes('سجل تجاري') || msg.includes('entreprise')) {
    return LEGAL_RESPONSES['شركة'];
  }
  if (msg.includes('محامي') || msg.includes('محامٍ') || msg.includes('محامى') || msg.includes('avocat') || msg.includes('قانوني')) {
    return LEGAL_RESPONSES['محامي'];
  }
  if (msg.includes('عقد') || msg.includes('توثيق') || msg.includes('موثق') || msg.includes('بيع') || msg.includes('contrat') || msg.includes('notaire')) {
    return LEGAL_RESPONSES['عقد'];
  }
  if (msg.includes('مستهلك') || msg.includes('غش') || msg.includes('حقوق') || msg.includes('consommateur')) {
    return LEGAL_RESPONSES['مستهلك'];
  }

  return `شكراً على سؤالك حول: **"${userMessage}"** 🤔

للأسف، لا أملك إجابة محددة حول هذا الموضوع في قاعدة بياناتي الحالية.

**ما يمكنني مساعدتك فيه:**
• إجراءات تأسيس الشركات
• توثيق العقود والمحررات
• حقوق المتقاضين والمستهلكين
• مهنة المحاماة والتوثيق

**للحصول على استشارة متخصصة:**
🔗 [زيارة المنصة الرئيسية](https://legal-algeria-hub.replit.app/)
📧 تواصل مع أحد المحامين المعتمدين

---
*Je suis en train d'améliorer mes capacités. Consultez un professionnel du droit pour des conseils spécifiques.*`;
}

export default function ChatBot() {
  const idCounterRef = useRef(1);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'bot',
      content: LEGAL_RESPONSES['default'],
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content?: string) => {
    const messageText = content || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: String(idCounterRef.current++),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

    const botResponse: Message = {
      id: String(idCounterRef.current++),
      role: 'bot',
      content: getBotResponse(messageText),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botResponse]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });

  const renderMessageContent = (content: string) => {
    // Simple markdown-like rendering for bold (**text**)
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      // Handle links [text](url)
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const before = part.slice(0, part.indexOf('['));
        const after = part.slice(part.indexOf(')') + 1);
        return (
          <span key={i}>
            {before}
            <a
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 underline hover:text-emerald-800"
            >
              {linkMatch[1]}
            </a>
            {after}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-emerald-50 to-teal-50" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
              ⚖️
            </div>
            <div>
              <h1 className="text-xl font-bold">بوت الميزان الذكي</h1>
              <p className="text-xs text-emerald-200">Mizan Bot – Assistant Juridique Algérien</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-xs text-emerald-200">متصل / En ligne</span>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="mr-2 p-1 rounded hover:bg-white/20 transition-colors"
              aria-label={isOpen ? 'تصغير' : 'تكبير'}
            >
              {isOpen ? '🗕' : '🗖'}
            </button>
          </div>
        </div>
        {/* Disclaimer */}
        <div className="bg-amber-600/80 text-white text-xs text-center py-1.5 px-4">
          ⚠️ <strong>تنبيه:</strong> هذا البوت يوفر معلومات قانونية عامة فقط. للاستشارة القانونية المتخصصة، يرجى التواصل مع محامٍ أو موثق معتمد. |
          <em> Ce bot fournit des informations juridiques générales uniquement. Consultez un professionnel.</em>
        </div>
      </header>

      {isOpen && (
        <>
          {/* Messages Area */}
          <main className="flex-1 overflow-y-auto p-4 chat-messages max-w-4xl mx-auto w-full">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-4 ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                {message.role === 'bot' && (
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm ml-2 mt-1 flex-shrink-0">
                    ⚖️
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm border border-emerald-100'
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {renderMessageContent(message.content)}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-emerald-200' : 'text-gray-400'
                    } text-left`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0">
                    👤
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex mb-4 justify-end">
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm ml-2 mt-1">
                  ⚖️
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-emerald-100">
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </main>

          {/* Quick Questions */}
          <div className="bg-white border-t border-emerald-100 px-4 py-2 max-w-4xl mx-auto w-full">
            <p className="text-xs text-gray-500 mb-2">💡 أسئلة سريعة / Questions rapides:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q.ar)}
                  disabled={isTyping}
                  className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {q.ar}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <footer className="bg-white border-t border-emerald-100 p-4 max-w-4xl mx-auto w-full">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك القانوني هنا... / Posez votre question juridique..."
                disabled={isTyping}
                className="flex-1 border border-emerald-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent disabled:opacity-50 bg-gray-50"
                dir="rtl"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isTyping || !inputValue.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-md"
                aria-label="إرسال"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 rotate-180"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
            {/* Footer branding */}
            <div className="text-center mt-2">
              <p className="text-xs text-gray-400">
                🏛️ <strong>Legal Algeria Hub</strong> — SIREP OASIS NEXUS TECH DZ |{' '}
                <a
                  href="https://legal-algeria-hub.replit.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  legal-algeria-hub.replit.app
                </a>
              </p>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
