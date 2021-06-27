---
layout: post
title: Introdução ao Micronaut Framework
comments: true
categories: 
    - GraalVM
    - Micronaut Framework
    - Java
    - Kotlin
description: Entenda o que é o Micronaut Framework, suas vantagens e desvantagens. Devo migrar do Spring Boot para o Micronaut?
image: /public/images/2021-06-27/micronaut.png
---

## O que é Micronaut?

Segundo a página oficial, o Micronaut Framework é um framework full-stack baseado na JVM para construção de microsserviços modulares, facilmente testáveis e aplicações Serverless.

O Micronaut Framework foi criado pela OCI (Object Computing Inc), a mesma empresa que criou o Grails Framework. Grails é um framework escrito para a linguagem Groovy e inspirado no Ruby on Rails.

## Vantagens

As principais vantagens de uma aplicação escrita usando Micronaut são o menor tempo para startup e menor consumo de memória. E como essa mágica acontece? Ao contrário do Spring Framework, cuja injeção de dependência é feita usando Reflection em tempo de execução, no Micronaut Framework a injeção de dependência é resolvida em tempo de compilação.

Outra vantagem interessante é baixa curva de aprendizado pois o Micronaut é muito parecido com o Spring, o framework mais utilizado no mundo Java segundo o [relatório publicado pela JRebel em 2020](https://www.jrebel.com/blog/2020-java-technology-report#framework-technology).

Além de funcionar com a linguagem Java, Micronaut é compatível com Kotlin e Groovy, a documentação geralmente inclui exemplos nessas três linguagens. A página inicial do framework promete compatibilidade com a linguagem Scala em breve.

Outra funcionalidade interessante é a preocupação do framework em ser compatível com a compilação para código nativo da GraalVM. Micronaut oferece algumas annotations como `@Introspected` e `@TypeHint`, por exemplo, que são úteis quando um programa é compilado para código nativo usando a GraalVM.

## Desvantagens

Comparado ao Spring, é um framework novo e não tão maduro. Então é possível encontrar alguns bugs durante o uso. Além disso, por ser relativamente novo, é mais difícil achar conteúdo a respeito.

Pelo mesmo motivo, é mais difícil achar vagas de emprego para trabalhar com Micronaut ao fazer uma comparação direta com as vagas disponíveis para Spring. São coisas que em alguns anos podem deixar de ser relevantes caso o seu crescimento continue.

O Spring Framework está sendo alterado para também suportar Ahead Of time Compilation, se isso acontecer logo, a probabilidade das pessoas migrarem para o Micronaut pode diminuir.

## Vale a pena trocar o Spring pelo Micronaut?

Uma das grandes vantagens de trabalhar com microsserviços é pode experimentar novas tecnologias. Então pode ser interessante experimentar o Micronaut em algum microsserviço de baixa relevância, dessa forma será possível avaliar o novo framework no ambiente de produção.

O uso do Micronaut pode trazer redução de custos de infraestrutura, pois o uso de memória é menor que o Spring. Vale a pena analisar se o framework atende os casos de uso da sua empresa e se a redução de memória é relevante no seu contexto.

Além disso, um dos problemas do Spring é que o tempo de inicialização pode ficar cada vez maior com o crescimento do serviço. Para serviços que são publicados em produção com frequência isso pode ser um problema. No Micronaut, o tempo tende a ser constante por causa da injeção de dependência ser processada em tempo de compilação.

Para otimizar ainda mais o consumo de infraestrutura, o Micronaut pode ser combinado com a compilação AOT da GraalVM, reduzindo ainda mais o uso de memória e deixando o tempo de inicialização da aplicação muito pequeno. Mas fique atento pois um microsserviço que funciona na JVM pode não funcionar diretamente ao ser compilado para código nativo.
