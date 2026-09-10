/**
 * 【order 模块】entity 层公共列转换器
 *
 * DECIMAL 列经 TypeORM 默认以字符串返回，这里统一转 number，与前端契约一致。
 * 可空 DECIMAL 保持 null，避免把「未退款」显示成 0。
 */

/** DECIMAL → number，NULL 保持 null */
export const decimalTransformer = {
  to: (value: number | string | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

/** DECIMAL NOT NULL → number */
export const decimalNotNullTransformer = {
  to: (value: number | string) => value,
  from: (value: string) => Number(value),
};
