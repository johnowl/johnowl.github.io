---
layout: post
title: Uma breve introdução à GraalVM
comments: true
categories: 
    - GraalVM
    - Micronaut Framework
    - Java
    - Kotlin
description: Entenda o que é a GraalVM, suas vantagens e desvantagens.
image: /public/images/2021-05-29/graalvm-chart.png
---

GraalVM é uma distribuição JDK, da mesma forma que OpenJDK ou Oracle JDK. Um JDK, ou Java Development Kit, ou ainda Kit de Desenvolvimento Java é um conjunto de ferramentas que servem para o desenvolvimento de software baseado em linguagens que rodam em uma máquina virtual Java como, por exemplo, a própria linguagem Java, Groovy, Scala, Kotlin, entre outras.

O principal diferencial da GraalVM é a capacidade de criar otimizações para economizar memória, processamento, reduzir a quantidade de lixo que é gerada e reduzir o número de vezes que o Garbage Collector é executado. Segundo a documentação da GraalVM, o compilador usa otimizações avançadas e técnicas agressivas e sofisticadas de inlining. De forma grosseira, isso quer dizer que os códigos são duplicados em sua aplicação para evitar a chamada de funções.

Testes mostraram que a simples troca da OpenJDK para a GraalVM EE [aumentou de 8% a 11% a eficiência de uma aplicação](https://www.graalvm.org/java/advantages/). Na prática, se você tem 10 máquinas para rodar sua aplicação, vai precisar de 9 para suportar a mesma quantidade de tráfego.

Outro diferencial da GraalVM é poder rodar códigos de linguagens diferentes compartilhando a mesma área de memória, isso quer dizer que é possível chamar uma função Java dentro de um código Javascript. Algumas linguagens suportadas são: Javascript, Ruby, R e Python.

Além disso, é possível compilar uma aplicação para código nativo usando uma ferramenta chamada [native-image](https://www.graalvm.org/reference-manual/native-image/), reduzindo o tempo de início de uma aplicação, o tamanho do arquivo binário, além de usar menos memória durante a execução. A imagem nativa é gerada usando a SubstrateVM, o código fonte da sua aplicação e suas dependências. O compilador remove todo o código que não será usado em tempo de execução além de fazer várias otimizações. Por isso o tempo de compilação para código nativo costuma ser demorado. Um simples arquivo `HelloWorld.java`, como abaixo, levou 42 segundos para ser compilado no meu computador (MacBook Pro, Processador 2.3 GHz Intel Core i5 Dual-Core, Memória RAM 8 GB 2133 MHz LPDDR3).


```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello world");
    }
}
```

A SubstrateVM faz parte da GraalVM, ela é uma JVM muito leve que é compilada junto com sua aplicação para fornecer coisas como o Garbage Collector, para que você não se preocupe em gerenciar a memória da sua aplicação.

A GraalVM possui duas versões: Community e Enterprise. A principal diferença entre as duas versões é que a versão Enterprise, além de paga, possui mais otimizações que a versão Community. A Oracle, empresa por trás da GraalVM, fornece a versão Enterprise gratuitamente em seu serviço de Cloud, a [Oracle Cloud Infrastructure](https://www.oracle.com/cloud/). A OCI possui um nível gratuito onde é possível testar a versão Enterprise.

A simples troca da OpenJDK pela GraalVM pode trazer vantagens interessantes no custo de sua infraestrutura com pouco esforço. Se você ficou animado com a compilação nativa, é bom lembrar que ela vai trazer complexidade adicional, pois ela possui algumas limitações. Em alguns testes que fiz usando o Micronaut Framework foi possível notar que um código que funciona na GraalVM pode não funcionar ao ser compilado para código nativo, algumas configurações e anotações adicionais podem ser necessárias. Além disso, a experiência do desenvolvedor fica ruim por causa do tempo que leva para uma aplicação compilar. Um "hello world" usando Micronaut Framework leva aproximadamente cinco minutos para compilar no meu MacBook Pro.
