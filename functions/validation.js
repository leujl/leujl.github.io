export function validateStudent(input, courseIds, creating = false) {
  const allowed = new Set(['uid','name','studentId','className','email','password','courses','active','requestId']);
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key=>!allowed.has(key))) throw new Error('欄位格式錯誤。');
  const value = {};
  for (const [key,max] of [['name',80],['studentId',40],['className',80],['email',254]]) {
    if(typeof input[key] !== 'string' || !input[key].trim() || input[key].length > max) throw new Error('請完整填寫學生資料。');
    value[key]=input[key].trim();
  }
  value.email=value.email.toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) throw new Error('Email 格式錯誤。');
  if(typeof input.active !== 'boolean' || !Array.isArray(input.courses) || input.courses.length>100 || input.courses.some(id=>!courseIds.includes(id))) throw new Error('課程或狀態格式錯誤。');
  value.active=input.active; value.courses=[...new Set(input.courses)];
  if(creating && (typeof input.password !== 'string' || input.password.length < 12 || input.password.length>128)) throw new Error('初始密碼需為 12～128 字元。');
  return value;
}
export function validateUid(uid) { if(typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new Error('帳號識別碼格式錯誤。');return uid; }

