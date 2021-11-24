---
layout: post
title: Gerenciamento de memória da JVM
comments: true
categories: 
    - JVM
    - Memory Management
    - Stack Memory
    - Heap Memory
description: Entenda como funciona o gerenciamento de memória da JVM e como o Garbage Collector te ajuda a não ter que se preocupar com isso.
image: /public/images/2021-11-23/memory.jpg
---

## Introdução

Em linguagens como C e C++ a pessoa programadora tem acesso direto à memória da máquina que seu código está rodando, ela precisa alocar e desalocar espaços na memória para guardar informações. E se esquecer de desalocar memória pode causar um problema na aplicação.

Em Java ou outras linguagens que rodam na JVM como Kotlin não é preciso ter essa preocupação. Pois a JVM oferece um mecanismo inteligente que faz a alocação e desalocação da memória automaticamente.

Mesmo assim é importante saber como o gerenciamento de memória da JVM funciona. Ter esse conhecimento pode ajuda e evitar problemas de performance causados por uso excessivo de memória além de facilitar a resolução de problemas desse tipo. O objetivo desse artigo é ser uma introdução ao assunto.

## Como funciona a memória na JVM

Em Java temos dois principais tipos de memória, a Stack e a Heap. A Stack, como o próprio nome diz, é um tipo de estrutura de dados conhecida como Pilha, ou seja, as informações são sempre adicionadas e removidas do topo da pilha. Uma boa analogia é uma pilha de moedas sobre uma mesa, onde você só pode adicionar ou tirar moedas a partir do topo.

Cada thread da sua aplicação tem sua própria Stack e lá são armazenadas as informações enquanto a thread está sendo executada, a pilha pode aumentar e diminuir de tamanho de acordo com o número de passos que a thread está executando. Quando a thread entra em uma nova função a pilha aumenta e quando a função é finalizada ela diminui. A Stack guarda valores de variáveis e referências para objetos e Strings que são gravadas na memória Heap.

A memória Stack é thread safe, pois somente uma thread pode acessar ela. Caso você faça uma chamada recursiva sem um fim, você pode causar um estouro da pilha, erro conhecido como StackOverFlowError.

Toda vez que criamos uma nova instância de um objeto ela é armazenada na memória Heap. Isso significa que cada vez que, em Java, fazemos um `AlgumObjeto obj = new AlgumObjeto()` estamos alocando o objeto na Heap e, nesse exemplo, a referência dele é mantida na variável `obj` que fica na memória da thread (Stack), com essa referência a thread que está usando o objeto consegue encontrá-lo na memória Heap.

![Imagem ilustrando a memória stack e heap. Imagem do artigo https://dzone.com/articles/java-memory-management]({{site.baseurl}}/public/images/2021-11-23/java-stack-and-heap.jpg)

Strings também são guardadas na memória Heap, em uma área especial chamada de String Pool. Dessa forma, como Strings são imutáveis, a JVM consegue fazer algumas otimizações como eliminar Strings duplicadas.

A memória Heap é dividida em duas grandes áreas chamadas de Young e Old. A área Young é subdividida em Eden, Survivor 0 e Survivor 1. Toda vez que um novo objeto é criado, ele é gravado na subdivisão Eden. E para que servem as outras áreas da memória Heap?

No começo do artigo eu falei que a pessoa que desenvolve usando a JVM não precisa se preocupar com gerenciamento de memória. É aqui que o Garbage Collector entra em ação. Essas subdivisões são usadas pelo Garbage Collector para controlar a idade dos objetos criados, sendo que cada área serve para um objeto com certa idade. Dessa forma, o Garbage Collector (GC) consegue eliminar os objetos que não possuem mais nenhuma referência de forma eficiente. Vamos ver como o GC funciona para entender melhor.

## Como funciona o Garbage Collector

O Garbage Collector, ou coletor de lixo, da JVM atua na memória Heap. Como adiantei acima, a memória Heap é dividida em subpartes e o GC consegue limpar e compactar o espaço de memória verificando quais objetos não possuem mais nenhuma referência e os elimina da memória.

![Imagem ilustrando as divisões da memória heap. Imagem do artigo: https://www.betsol.com/blog/java-memory-management-for-java-virtual-machine-jvm/]({{site.baseurl}}/public/images/2021-11-23/java-heap-memory.png)

Quando sua aplicação inicia, você começa a popular a área de memória conhecida como Eden, quando ela fica cheia o GC é executado (Minor GC) e os objetos que não estão mais em uso são eliminados. Os objetos que ainda estão em uso são movidos para a Survivor 0, ou seja, esses objetos sobreviveram ao Garbage Collector.

Na próxima vez que o GC executar, se os objetos tiverem sobrevivido a determinada quantidade de ciclos de GC, ele irá movê-los de Survivor 0 para Survivor 1 e apagar os que estão sem uso. Cada ciclo de GC que um objeto sobrevive incrementa 1 na idade do objeto.

Esse ciclo também se repete em Survivor 1, e os objetos que sobreviverem por um número N de ciclos de GC serão movidos para a área de memória da Heap conhecida como Old. Caso a área Old fique cheia, acontece o que chamamos de Major GC, esse tipo de Garbage Collector pausa todas as threads da sua aplicação para fazer a limpeza da memória Old. Isso é chamado de "Stop de World" e pode gerar problemas de performance em sua aplicação se ele estiver com muitos acessos. Caso o GC não consiga liberar espaço da memória para novos objetos você pode receber um erro `OutOfMemoryError`.

## Conclusão

Neste artigo foi mostrado de forma bastante simples e resumida como a memória é gerenciada pela JVM. Além disso, foi mostrado como o Garbage Collector geracional funciona, esse Garbage Collector é conhecido como CMS (Concurrent Mark Sweep). Também vimos que mesmo sendo uma ótima solução, caso a região de memória heap conhecida como old fique cheia com frequência, podemos ter problemas de performance em nossa aplicação pois o GC irá realizar um Major GC, ocasionando a pausa de todas as threads da aplicação.

O CMS Collector é o default no Java 8, a partir do Java 9 um novo Garbage Collector chamado de G1 passou a ser o padrão, inclusive na versão Java 11, que é uma versão LTS (Long Term Support). Mas esse é assunto para outro texto.
