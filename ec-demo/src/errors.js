// ドメインエラー: テストや呼び出し側は `code` で判定する
export class DomainError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}
