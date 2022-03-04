---
layout: post
title: Logs em Json com Micronaut e Logback
comments: true
categories: 
    - Logback
    - Micronaut
    - Kotlin
    - Json
    - Logging
    - Logs
description: Veja duas formas de configurar o Logback para formatar os logs em Json. Uma forma é usando o arquivo de configuração do Logback e a outra é programaticamente usando Kotlin.
image: /public/images/2022-03-04/logs.jpg
---

## Introdução

Logs sempre foram importantes para ajudar os desenvolvedores a identificar problemas em suas aplicações quando estão rodando em ambiente produtivo.

Atualmente, com a arquitetura de microsservços, cada microsserviço emite logs nas saídas padrão do sistema operacional e essas informações são capturadas por agregadores de logs. Em aplicações monolíticas é comum que as aplicações escrevam logs em arquivos e gerenciem o tamanho e idade dos logs.

## Logs no Micronaut

Segundo a documentação, Micronaut usa o SLF4J para fazer o log de mensagens. A sigla SLF4J significa Simple Logging Facade for Java, ou seja, é apenas um conjunto de interfaces que as implementações de logs usam. Dessa forma é possível escolher a implementação que será usada em seu projeto sem impactar as bibliotecas que você importou.

Micronaut usa o Logback como implementação padrão da SLF4J, por isso, quando você cria um novo projeto com Micronaut, se você olhar no diretório resources irá notar a existência de um arquivo chamado `logback.xml`. Esse arquivo possui as configurações do Logback.

O Logback é uma implementação muito utilizada e nasceu para substituir o Log4j, inclusive ela foi criada pelos mesmos desenvolvedores da Log4j. Então, se você está iniciando um projeto, dê preferência para o Logback.

## Configuração do Logback via XML para gerar logs em JSON

1. Adicione as dependências abaixo no arquivo `build.gradle` ou `build.gradle.kts`:

   ```groovy
   runtimeOnly("ch.qos.logback.contrib:logback-json-classic:0.1.5") 
   runtimeOnly("ch.qos.logback.contrib:logback-jackson:0.1.5")
   ```

2. Atualize o arquivo `logback.xml` que fica no diretório `src/main/resources`. Você precisa adicionar as configurações abaixo dentro da tag `appender`:

```xml
<layout class="ch.qos.logback.contrib.json.classic.JsonLayout"> 
   <jsonFormatter 
            class="ch.qos.logback.contrib.jackson.JacksonJsonFormatter"> 
         <prettyPrint>false</prettyPrint> 
   </jsonFormatter> 
   <timestampFormat>yyyy-MM-dd' 'HH:mm:ss.SSS</timestampFormat> 
   <appendLineSeparator>true</appendLineSeparator> 
</layout>
```

Pronto! Agora os logs serão gerados no formato Json.

## Como configurar o Logback programaticamente para gerar logs em JSON

1. Apague o arquivo `logback.xml` do seu projeto.

2. Adicione as dependências abaixo no arquivo `build.gradle` ou `build.gradle.kts`:

   ```groovy
   implementation("ch.qos.logback.contrib:logback-json-classic:0.1.5") 
   implementation("ch.qos.logback.contrib:logback-jackson:0.1.5")
   ```

3. Crie a classe abaixo, ela será responsável pelas configurações:

   ```kotlin
   package com.johnowl 
   
   import ch.qos.logback.classic.Level 
   import ch.qos.logback.classic.Logger 
   import ch.qos.logback.classic.LoggerContext 
   import ch.qos.logback.contrib.json.classic.JsonLayout 
   import ch.qos.logback.classic.spi.Configurator 
   import ch.qos.logback.classic.spi.ILoggingEvent 
   import ch.qos.logback.contrib.jackson.JacksonJsonFormatter 
   import ch.qos.logback.core.ConsoleAppender 
   import ch.qos.logback.core.encoder.LayoutWrappingEncoder 
   import ch.qos.logback.core.spi.ContextAwareBase 
   
   class MyCustomJsonConfigurator : ContextAwareBase(), Configurator { 
      override fun configure(loggerContext: LoggerContext) { 
   
         val consoleAppender = ConsoleAppender<ILoggingEvent>() 
         consoleAppender.context = loggerContext 
         consoleAppender.name = "console" 
         val encoder = LayoutWrappingEncoder<ILoggingEvent>() 
         encoder.context = loggerContext 
   
         val jsonFormatter = JacksonJsonFormatter() 
         jsonFormatter.isPrettyPrint = false 
   
         val layout = JsonLayout() 
         layout.isAppendLineSeparator = true 
         layout.timestampFormat = "yyyy-MM-dd' 'HH:mm:ss.SSS" 
         layout.jsonFormatter = jsonFormatter 
   
         layout.context = loggerContext 
         layout.start() 
         encoder.layout = layout 
   
         consoleAppender.encoder = encoder 
         consoleAppender.start() 
   
         val rootLogger: Logger = loggerContext.getLogger(Logger.ROOT_LOGGER_NAME) 
         rootLogger.addAppender(consoleAppender) 
         rootLogger.level = Level.INFO 
   
      } 
   }
   ```

4. Crie a estrutura de diretórios `META-INF/services` dentro do diretório `src/main/resources`
5. Adicione um arquivo chamado `ch.qos.logback.classic.spi.Configurator` no diretório recém criado.
6. Adicione o nome do pacote e nome da classe de configuração no arquivo que você acabou de criar, no meu caso ficou como `com.johnowl.MyCustomJsonConfigurator`.

Pronto! Agora o Logback irá gerar logs no formato Json. Caso você queira alterar o log level de algum pacote, veja no próximo capítulo como fazer isso.

## Como mudar o log level de pacotes com Logback e Micronaut

Caso você esteja usando o arquivo `logback.xml`, a maneira mais simples é adicionar dentro da tag `configuration` uma nova tag informando o nome do pacote e o log level, veja no exemplo abaixo:

```xml
   <logger name="my.package" level="debug" />
```

Outra forma de fazer isso é usando o arquivo de configurações do Micronaut, ele fica no diretório resources e chama application.yml. Isso é bastante útil se você escolheu usar a configuração do Logback via código. Veja abaixo um exemplo:

```yml
logger: 
  levels: 
    my.package: DEBUG
    my.other.package: INFO
```

## Conclusão

A forma de configurar o Logback tanto via XML quanto programaticamente pode ser usado em qualquer framework, isso não se limita ao Micronaut. Se quiser fazer com Spring os passos a serem seguidos serão os mesmos. Uma vantagem de gerar os logs no formato Json é facilitar sua captura por ferramentas de agregação de logs.

A forma de configuração via código pode ser útil se você quer criar uma biblioteca customizada para sua empresa. Normalmente isso não é necessário, a não ser que você tenha necessidades muito específicas no seu caso de uso.
