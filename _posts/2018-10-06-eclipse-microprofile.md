---
layout: post
title: Eclipse MicroProfile
comments: true
categories: 
    - Java
    - Micro Services
description: O que é e para que serve Eclipse MicroProfile?
image: /public/images/2018-10-06/microprofile-logo.png
---

Eclipse MicroProfile é uma iniciativa que visa otimizar o Java EE para a arquitetura de microsserviços. O objetivo do Eclipse Microprofile é definir um padrão de APIs do Java EE que sejam portáteis e rodem na runtime de qualquer fornecedor. As principais empresas que apoiam esse projeto são IBM, Red Hat, Tomitribe e Payara.

A motivação por trás do MicroProfile veio dos desenvolvedores Java que gostariam de utilizar tecnologias Java EE para criar microsserviços e estavam em busca de funcionalidades como Service Discovery, Health Checks, Circuit Breakers, etc. Além disso a comunidade Java EE também queria evitar a fragmentação, visto que estavam sendo adotadas diferentes formas de desenvolver microsserviços. Por causa disso, e no espírito de comunidade Open Source, eles decidiram colaborar e trabalhar juntos para criar essa iniciativa.

A versão 1.0 do Eclipse MicroProfile foi anunciada no evento JavaOne 2016, nessa ocasião foram apresentadas demos de diferentes fornecedores baseadas no projeto [Microprofile Showcase Application](https://github.com/eclipse/microprofile-conference). Os testes realizados não deveriam ser comparados diretamente, já que foram executados em diferentes máquinas e foram validados microserviços diferentes, mas serve a título de informação.

|Fornecedor|Microsserviço|Tamanho do JAR em Mb|Tempo de início em segundos|
|--- |--- |--- |--- |
|WebSphere Liberty|Session Voting|35|7|
|WildFly Swarm|Session|65|6|
|Payara|Session Schedule|33|5|
|TomEE|Speaker|35|3|
|KumuluzEE|Session Schedule|11|2|

Na prática, no final do seu desenvolvimento você tem um jar com um servidor embutido, parecido com Spring Boot, mas baseado em Java EE. Eclipse MicroProfile é para você? Se você está contente com Spring Boot ou outro framework, esquece isso. Mas caso sua empresa use Java EE e estejam migrando para microsserviços, esse é o caminho.

Mais informações:
* https://dzone.com/articles/microprofile-5-things-you-need-to-know
* https://jaxenter.com/one-year-anniversary-look-eclipse-microprofile-135623.html