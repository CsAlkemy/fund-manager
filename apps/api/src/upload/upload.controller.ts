import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { put } from '@vercel/blob';

const isVercel = !!process.env.VERCEL;

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  @Post('screenshot')
  @ApiOperation({ summary: 'Upload a payment screenshot (max 5MB, images only)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: isVercel
        ? undefined
        : diskStorage({
            destination: './uploads',
            filename: (_req, file, cb) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
              cb(null, `screenshot-${uniqueSuffix}${extname(file.originalname)}`);
            },
          }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadScreenshot(@UploadedFile() file: Express.Multer.File) {
    if (isVercel) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = `screenshot-${uniqueSuffix}${extname(file.originalname)}`;
      const blob = await put(`screenshots/${filename}`, file.buffer, {
        access: 'public',
        contentType: file.mimetype,
      });
      return { url: blob.url, filename, size: file.size };
    }

    return { url: `/uploads/${file.filename}`, filename: file.filename, size: file.size };
  }

  @Post('image')
  @ApiOperation({ summary: 'Upload a general image — avatar, logo, cover (max 2MB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: isVercel
        ? undefined
        : diskStorage({
            destination: './uploads',
            filename: (_req, file, cb) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
              cb(null, `image-${uniqueSuffix}${extname(file.originalname)}`);
            },
          }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (isVercel) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = `image-${uniqueSuffix}${extname(file.originalname)}`;
      const blob = await put(`images/${filename}`, file.buffer, {
        access: 'public',
        contentType: file.mimetype,
      });
      return { url: blob.url, filename, size: file.size };
    }

    return { url: `/uploads/${file.filename}`, filename: file.filename, size: file.size };
  }
}
