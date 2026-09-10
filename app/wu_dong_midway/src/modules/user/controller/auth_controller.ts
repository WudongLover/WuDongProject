import { Body, Controller, Get, Inject, Post } from '@midwayjs/core'; import { Context } from '@midwayjs/koa'; import { AuthService } from '../service/auth_service';
@Controller('/api/user') export class AuthController { @Inject() service:AuthService; @Inject() ctx:Context;
 private out(x:any){this.ctx.cookies.set('wudong_refresh',x.refreshToken,{httpOnly:true,maxAge:30*86400000,path:'/'});return {code:0,message:'ok',data:{token:x.token,expire:x.expire,user:x.user}};}
 @Post('/sms-code') sms(){return {code:0,message:'ok',data:{sent:true,hint:'验证码已发送'}};} @Post('/login-sms') async smsLogin(@Body('phone')p:string,@Body('smsCode')s:string){return this.out(await this.service.login(p,undefined,s));}
 @Post('/login-password') async pwd(@Body('phone')p:string,@Body('password')w:string){return this.out(await this.service.login(p,w));} @Post('/register') async reg(@Body()b:any){return this.out(await this.service.register(b.phone,b.password,b.name));}
 @Post('/logout') async logout(){await this.service.logout(this.ctx.cookies.get('wudong_refresh'));this.ctx.cookies.set('wudong_refresh',null,{maxAge:0,path:'/'});return{code:0,message:'ok',data:null};}
 @Post('/refresh') async refresh(){return{code:0,message:'ok',data:await this.service.refreshAccess(this.ctx.cookies.get('wudong_refresh'))};}
 @Get('/me') async me(){return{code:0,message:'ok',data:await this.service.me((this.ctx as any).userId)};} @Post('/profile') async profile(@Body()b:any){return{code:0,message:'ok',data:await this.service.updateProfile((this.ctx as any).userId,b?.name,b?.bio)};}
}
