import { Provide } from '@midwayjs/core';
import { InjectDataSource, InjectEntityModel } from '@midwayjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AddressEntity } from '../entity/address_entity';

export interface AddressInput {
  name: string;
  phone: string;
  region: string;
  detail: string;
  isDefault: boolean;
}

@Provide()
export class AddressMapper {
  @InjectEntityModel(AddressEntity)
  addressRepo: Repository<AddressEntity>;

  @InjectDataSource('default')
  dataSource: DataSource;

  list(userId: string): Promise<AddressEntity[]> {
    return this.addressRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC', id: 'DESC' },
    });
  }

  findOwned(userId: string, id: string): Promise<AddressEntity | null> {
    return this.addressRepo.findOneBy({ id, userId });
  }

  create(userId: string, input: AddressInput): Promise<AddressEntity> {
    return this.dataSource.transaction(async (em) => {
      const repo = em.getRepository(AddressEntity);
      const firstAddress = (await repo.countBy({ userId })) === 0;
      const makeDefault = firstAddress || input.isDefault;
      if (makeDefault) {
        await repo.update({ userId, isDefault: 1 }, { isDefault: 0 });
      }
      return repo.save(
        repo.create({
          userId,
          name: input.name,
          phone: input.phone,
          region: input.region,
          detail: input.detail,
          isDefault: makeDefault ? 1 : 0,
        })
      );
    });
  }

  async update(userId: string, id: string, input: AddressInput): Promise<AddressEntity | null> {
    return this.dataSource.transaction(async (em) => {
      const repo = em.getRepository(AddressEntity);
      const address = await repo.findOneBy({ id, userId });
      if (!address) return null;
      if (input.isDefault) {
        await repo.update({ userId, isDefault: 1 }, { isDefault: 0 });
      }
      Object.assign(address, input, { isDefault: input.isDefault ? 1 : 0 });
      return repo.save(address);
    });
  }

  async remove(userId: string, id: string): Promise<boolean> {
    return this.dataSource.transaction(async (em) => {
      const repo = em.getRepository(AddressEntity);
      const address = await repo.findOneBy({ id, userId });
      if (!address) return false;
      await repo.softDelete(address.id);
      if (address.isDefault) {
        const next = await repo.findOne({
          where: { userId },
          order: { createdAt: 'DESC', id: 'DESC' },
        });
        if (next) await repo.update(next.id, { isDefault: 1 });
      }
      return true;
    });
  }

  async setDefault(userId: string, id: string): Promise<AddressEntity | null> {
    return this.dataSource.transaction(async (em) => {
      const repo = em.getRepository(AddressEntity);
      const address = await repo.findOneBy({ id, userId });
      if (!address) return null;
      await repo.update({ userId, isDefault: 1 }, { isDefault: 0 });
      address.isDefault = 1;
      return repo.save(address);
    });
  }
}
