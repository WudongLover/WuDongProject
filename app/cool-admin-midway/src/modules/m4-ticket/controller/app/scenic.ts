import { BaseController, CoolTag, CoolUrlTag, TagTypes } from '@cool-midway/core';
import { Controller, Get, Inject } from '@midwayjs/core';
import { M4ScenicService } from '../../service/scenic';

@Controller('/app/m4/scenic')
@CoolUrlTag()
export class AppM4ScenicController extends BaseController {
  @Inject()
  scenicService: M4ScenicService;

  @Get('/list', { summary: '景区与门票列表' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async listScenics() {
    return this.ok(await this.scenicService.list());
  }
}
