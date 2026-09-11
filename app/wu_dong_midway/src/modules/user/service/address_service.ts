import { Inject, Provide } from '@midwayjs/core';
import { ApiError } from '../../m5-community/error/api_error';
import { AddressEntity } from '../entity/address_entity';
import { AddressInput, AddressMapper } from '../mapper/address_mapper';

const PHONE_RE = /^1\d{10}$/;
const NAME_MAX_LENGTH = 64;
const REGION_MAX_LENGTH = 128;
const DETAIL_MAX_LENGTH = 255;

export interface AddressVo {
  id: string;
  name: string;
  phone: string;
  region: string;
  detail: string;
  isDefault: boolean;
}

@Provide()
export class AddressService {
  @Inject()
  addressMapper: AddressMapper;

  async list(userId: string): Promise<AddressVo[]> {
    return (await this.addressMapper.list(userId)).map((item) => this.toVo(item));
  }

  async create(userId: string, body: any): Promise<AddressVo> {
    return this.toVo(await this.addressMapper.create(userId, this.normalize(body)));
  }

  async update(userId: string, id: string, body: any): Promise<AddressVo> {
    const address = await this.addressMapper.update(userId, id, this.normalize(body));
    if (!address) throw new ApiError(1003, '地址不存在', 404);
    return this.toVo(address);
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const removed = await this.addressMapper.remove(userId, id);
    if (!removed) throw new ApiError(1003, '地址不存在', 404);
    return true;
  }

  async setDefault(userId: string, id: string): Promise<AddressVo> {
    const address = await this.addressMapper.setDefault(userId, id);
    if (!address) throw new ApiError(1003, '地址不存在', 404);
    return this.toVo(address);
  }

  private normalize(body: any): AddressInput {
    const name = String(body?.name ?? '').trim();
    const phone = String(body?.phone ?? '').trim();
    const region = String(body?.region ?? '').trim();
    const detail = String(body?.detail ?? '').trim();

    if (!name) throw new ApiError(1004, '收货人不能为空');
    if (name.length > NAME_MAX_LENGTH) throw new ApiError(1004, `收货人不能超过 ${NAME_MAX_LENGTH} 个字符`);
    if (!PHONE_RE.test(phone)) throw new ApiError(1004, '手机号格式不正确');
    if (!region) throw new ApiError(1004, '地区不能为空');
    if (region.length > REGION_MAX_LENGTH) throw new ApiError(1004, `地区不能超过 ${REGION_MAX_LENGTH} 个字符`);
    if (!detail) throw new ApiError(1004, '详细地址不能为空');
    if (detail.length > DETAIL_MAX_LENGTH) throw new ApiError(1004, `详细地址不能超过 ${DETAIL_MAX_LENGTH} 个字符`);

    return {
      name,
      phone,
      region,
      detail,
      isDefault: body?.isDefault === true,
    };
  }

  private toVo(item: AddressEntity): AddressVo {
    return {
      id: String(item.id),
      name: item.name,
      phone: item.phone,
      region: item.region,
      detail: item.detail,
      isDefault: item.isDefault === 1,
    };
  }
}
