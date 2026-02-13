import { Global, Module } from '@nestjs/common';
import {
  I18nModule,
  I18nJsonLoader,
  AcceptLanguageResolver,
  QueryResolver,
  CookieResolver,
} from 'nestjs-i18n';
import * as path from 'path';

@Global()
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'pt',
      loader: I18nJsonLoader,
      loaderOptions: {
        path: path.join(process.cwd(), 'src/i18n'),
        watch: true,
        interpolation: {
          prefix: '{{',
          suffix: '}}',
        },
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'locale'] },
        CookieResolver,
        AcceptLanguageResolver,
      ],
    }),
  ],
  exports: [I18nModule],
})
export class I18nGlobalModule {}
