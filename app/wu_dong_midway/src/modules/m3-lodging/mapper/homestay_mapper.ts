import { Provide } from '@midwayjs/core'; import { InjectEntityModel } from '@midwayjs/typeorm'; import { Like, Repository } from 'typeorm'; import { HomestayEntity } from '../entity/homestay_entity';
@Provide() export class HomestayMapper { @InjectEntityModel(HomestayEntity) repo: Repository<HomestayEntity>;
  async page(q: any) { const page=Math.max(1,Number(q.page)||1), size=Math.min(100,Math.max(1,Number(q.size||q.pageSize)||10)); const where:any={}; if(q.status) where.status=q.status; if(q.merchantId) where.merchantId=String(q.merchantId); if(q.keyword) where.name=Like('%'+q.keyword.trim()+'%'); const [list,total]=await this.repo.findAndCount({where,order:{id:'DESC'},skip:(page-1)*size,take:size}); return {list,total,page,size}; }
  find(id:string){ return this.repo.findOneBy({id}); } create(data:any){ return this.repo.save(this.repo.create(data)); } update(id:string,data:any){ return this.repo.update({id},data); } remove(id:string){ return this.repo.softDelete({id}); }
}
