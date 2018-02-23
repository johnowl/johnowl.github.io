---
layout: post
title: O que são containers
comments: true
categories: 
    - Docker
    - Containers
description: O que são containers? Por que surgiram? Quais os benefícios eles trazem?
---

Antes de entender o que são **containers** precisamos olhar como a publicação de aplicações web tem sido feita e quais os problemas eram enfrentados no deploy de aplicações e manutenção da **infraestrutura**. Imagina que você tem um e-commerce com os módulos: produtos, clientes, pedidos, promoções, entrega e pagamento. No final do seu deploy é gerado um pacote com todos os componentes necessários para sua aplicação rodar em produção.

O próximo passo é enviar esse pacote para o ambiente de produção usando alguma ferramenta de entrega contínua ou até mesmo usando o bom e velho FTP. Se você tem um único servidor, é bem fácil fazer esse trabalho. O número de usuários do e-commerce vai crescendo e essa máquina começa a ficar lenta pois o poder de processamento não está sendo suficiente. O primeiro passo que você pode tomar é aumentar o número de processadores e a quantidade de memória. Você faz isso e após alguns meses o número de usuários continua aumentando, sua máquina já chegou no limite de upgrade, chamamos esse upgrade de **escalonamento vertical**. O que fazer?

Ao invés de ter um único servidor, você precisa ter duas ou mais máquinas para aguentar o novo tráfego de requisições, isso se chama **escalonamento horizontal**. A solução é usar um **balanceador de carga** para receber as requisiçoes e ter vários servidores com sua aplicação instalada. Dessa forma você consegue atender um número maior de requisições sem perda de performance e evitando prejuízos para sua empresa.

Feito isso, agora você tem sua aplicação rodando em três máquinas e está chegando a Black Friday, você sabe que essas máquinas conseguem aguentar o dobro de usuários que seu site tem normalmente. Mas a previsão para a Black Friday é que o volume de usuários aumente dez vezes! O que fazer agora? Comprar mais computadores, instalar sistema operacional, instalar sua aplicação nas novas máquinas somente por que em um dia do ano o volume vai ficar muito acima do normal? Essa não parece uma decisão muito inteligente, pois no restante do ano você terá vários computadores com poder de processamento ocioso, e isso custa dinheiro para sua empresa.

Uma das soluções inventadas para solucionar esse tipo de problema é a **computação em nuvem**! Dessa forma você não precisa se preocupar com **máquinas físicas**, você tem máquinas virtuais que podem estar rodando em qualquer computador e o processo de criação de **máquinas virtuais** é muito mais rápido do que o **provisionamento** de máquinas físicas. Poxa, legal, agora é muito mais fácil pra mim. Então por que inventaram os **containers**? Os **containers** ajudam a otimizar os recursos das máquinas e são muito mais rápidos de serem provisionados que máquinas virtuais! Veja a imagem abaixo:

![Máquinas Virtuais versus Containers, crédito: docker.com]({{site.baseurl}}/public/images/2018-02-28/containers-vs-vms.jpg)

Na utilização de máquinas virtuais, você tem um computador com um sistema operacional completo para hospedar várias máquinas virtuais. Cada máquina virtual tem um cópia completa do sistema operacional, sua aplicação e todas as suas dependências. Com a utilização de **containers** a **máquina hospedeira** compartilha os componentes do sistema operacional, o **container** contém somente sua aplicação e as **dependências**. E tudo continua completamente **isolado** como nas máquinas virtuais.

É muito barato criar e destruir **containers** e isso trás uma outra vantagem no momento em que a aplicação está sendo desenvolvida. Você consegue criar um **ambiente idêntico ao de produção** na sua máquina, isso evita aqueles problemas de erros que só acontecem em produção pois a versão do pacote X no computador do desenvolvedor é diferente da versão de produção. Isso também reduz o trabalho quando existe uma atualização do sistema operacional, pois você não está replicando cópias dele por toda a parte.

Os principais **benefícios** que o uso de **containers** nos trás são: otimização na utilização de recursos de computação, facilidade de provisionamento, redução de erros por causa de ambientes diferentes em desenvolvimento e produção.