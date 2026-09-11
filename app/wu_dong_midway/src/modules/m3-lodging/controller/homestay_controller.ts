import { Body, Controller, Del, Get, Inject, Param, Patch, Post, Query } from '@midwayjs/core'; import { InjectEntityModel } from '@midwayjs/typeorm'; import { Repository } from 'typeorm'; import { HomestayService } from '../service/homestay_service'; import { HomestayEntity } from '../entity/homestay_entity'; import { RoomTypeEntity } from '../entity/room_type_entity'; import { RoomCalendarEntity } from '../entity/room_calendar_entity'; import { RoomCalendarService } from '../service/room_calendar_service';
@Controller('/api/app/m3/homestay') export class HomestayController { @Inject() service: HomestayService; @Inject() roomCalendar: RoomCalendarService; @InjectEntityModel(HomestayEntity) homestays:Repository<HomestayEntity>; @InjectEntityModel(RoomTypeEntity) rooms:Repository<RoomTypeEntity>; @InjectEntityModel(RoomCalendarEntity) calendars:Repository<RoomCalendarEntity>;
  private ok(data:any){return {code:0,message:'ok',data};}
  @Get('/') async list(){
    const hs=await this.homestays.find({where:{status:'ENABLED'},order:{id:'DESC'}});
    const result = await Promise.all(hs.map(async h => {
      const rooms = await this.rooms.find({where:{homestayId:h.id},order:{id:'ASC'}});
      return {...h, images:h.images||[], tags:h.tags||[], facilities:h.facilities||[], rooms, reviews:[]};
    }));
    return this.ok(result);
  }
  @Get('/detail/:id') async detail(@Param('id') id:string){ const h=await this.service.info(id); if(!h)return this.ok(null); return this.ok({...h,images:h.images||[],tags:h.tags||[],facilities:h.facilities||[],rooms:await this.rooms.find({where:{homestayId:id},order:{id:'ASC'}}),reviews:[]}); }
  /** 房态日历：今天起 30 天，缺失日期按房型总库存补齐后返回，保证前端格子与下单计价同源 */
  @Get('/room-calendar/:roomTypeId') async calendar(@Param('roomTypeId') id:string){ return this.ok(await this.roomCalendar.window(id)); }
  @Get('/page') async page(@Query() q:any){ return this.ok(await this.service.page(q)); } @Post('/add') async add(@Body() b:any){ return this.ok(await this.service.create(b)); }
  @Patch('/update/:id') async update(@Param('id') id:string,@Body() b:any){ return this.ok(await this.service.update(id,b)); } @Del('/delete/:id') async remove(@Param('id') id:string){ return this.ok(await this.service.remove(id)); }
  @Get('/room-type/page') async roomPage(@Query() q:any){ const page=Math.max(1,Number(q.page)||1),size=Math.min(100,Math.max(1,Number(q.size)||10)); const [list,total]=await this.rooms.findAndCount({where:q.homestayId?{homestayId:String(q.homestayId)}:{},order:{id:'DESC'},skip:(page-1)*size,take:size}); return this.ok({list,total,page,size}); }
  @Post('/room-type/add') async roomAdd(@Body() b:any){ return this.ok(await this.rooms.save(this.rooms.create({...b,homestayId:String(b.homestayId),price:Number(b.price||0)}))); }
  @Patch('/room-type/update/:id') async roomUpdate(@Param('id') id:string,@Body() b:any){ await this.rooms.update({id},b); return this.ok(await this.rooms.findOneBy({id})); }
  @Del('/room-type/delete/:id') async roomDelete(@Param('id') id:string){ await this.rooms.softDelete({id}); return this.ok(true); }
  @Post('/room-calendar/add') async calAdd(@Body() b:any){ return this.ok(await this.calendars.save(this.calendars.create({...b,roomTypeId:String(b.roomTypeId),stock:Number(b.stock||0),priceDelta:Number(b.priceDelta||0)}))); }
  @Patch('/room-calendar/update/:id') async calUpdate(@Param('id') id:string,@Body() b:any){ await this.calendars.update({id},b); return this.ok(await this.calendars.findOneBy({id})); }
}
