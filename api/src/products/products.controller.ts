import { Controller, Get, Post, Body, Param, Query, ValidationPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Body(ValidationPipe) dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  async findAll(@Query(ValidationPipe) query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get('owned')
  async getByOwner(@Query('publicKey') publicKey: string) {
    return this.productsService.getProductsByOwner(publicKey);
  }

  @Get('batch/:batch')
  async getByBatch(@Param('batch') batch: string) {
    return this.productsService.getProductsByBatch(batch);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/provenance')
  async getProvenance(@Param('id') id: string) {
    return this.productsService.getProvenance(id);
  }

  @Get(':id/lifecycle')
  async getLifecycle(@Param('id') id: string) {
    return this.productsService.getLifecycle(id);
  }

  @Get(':id/carbon')
  async getCarbon(@Param('id') id: string) {
    return this.productsService.getCarbon(id);
  }

  @Get(':id/certificates')
  async getCertificates(@Param('id') id: string) {
    return this.productsService.getCertificates(id);
  }
}
