/**
 * 【m1-goods 模块】商品（wudong_m1_product，衣/特产统一表）
 * controller 层：接口与路由
 */
import {
  Body,
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@midwayjs/core';
import { Validate } from '@midwayjs/validate';
import { ProductCreateDTO, ProductPageQueryDTO } from '../dto/product.dto';
import { ErrorCode, fail, ok } from '../dto/result';
import { ProductService } from '../service/product_service';

@Controller('/api/v1/m1')
export class ProductController {
  @Inject()
  productService: ProductService;

  /** 分页查询商品列表 */
  @Get('/products')
  @Validate()
  async page(@Query() query: ProductPageQueryDTO) {
    const data = await this.productService.page(query);
    return ok(data);
  }

  /** 查询商品详情 */
  @Get('/products/:id')
  async detail(@Param('id') id: string) {
    const product = await this.productService.detail(id);
    if (!product) {
      return fail(ErrorCode.NOT_FOUND, '商品不存在');
    }
    return ok(product);
  }

  /** 新增商品（商家后台操作，鉴权接入前使用 mock merchant_id） */
  @Post('/products')
  @Validate()
  async create(@Body() body: ProductCreateDTO) {
    const product = await this.productService.create(body);
    return ok(product);
  }

  /** 逻辑删除商品 */
  @Del('/products/:id')
  async remove(@Param('id') id: string) {
    const existed = await this.productService.remove(id);
    if (!existed) {
      return fail(ErrorCode.NOT_FOUND, '商品不存在或已删除');
    }
    return ok(null);
  }
}