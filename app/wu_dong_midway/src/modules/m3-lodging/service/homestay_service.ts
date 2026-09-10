import { Inject, Provide } from '@midwayjs/core'; import { InjectEntityModel } from '@midwayjs/typeorm'; import { Repository } from 'typeorm'; import { HomestayEntity } from '../entity/homestay_entity'; import { HomestayMapper } from '../mapper/homestay_mapper';
@Provide() export class HomestayService { @Inject() mapper: HomestayMapper; @InjectEntityModel(HomestayEntity) repo: Repository<HomestayEntity>;
  page(q:any){ return this.mapper.page(q); } async info(id:string){ const row=await this.mapper.find(id); if(!row) return null; return row; }
  create(body:any){ if(!body?.name?.trim()||!body?.cover?.trim()) throw new Error('民宿名称和封面不能为空'); return this.mapper.create({...body,name:body.name.trim(),cover:body.cover.trim()}); }
  async update(id:string,body:any){ if(!(await this.mapper.find(id))) return null; await this.mapper.update(id,body); return this.mapper.find(id); }
  async remove(id:string){ if(!(await this.mapper.find(id))) return false; await this.mapper.remove(id); return true; }
}
