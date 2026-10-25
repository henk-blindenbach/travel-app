import type { Locale } from "./config";

export type PublicDictionary = {
  meta: {
    description: string;
  };
  header: {
    wordmark: string;
    stories: string;
    trips: string;
    about: string;
    myTrip: string;
    language: string;
  };
  home: {
    emptyEyebrow: string;
    emptyTitle: string;
    travelling: string;
    departingSoon: string;
    followDays: string;
    nextTrip: string;
    storiesAndPhotos: string;
    followTrip: string;
    viewTrip: string;
    onTheRoad: string;
    tripStories: string;
    latestStories: string;
    storiesWhenTravelling: string;
    viewTheTrip: string;
    dayN: string;
    onTheWay: string;
    dayReport: string;
    storiesEmpty: string;
    thenTravelling: string;
    upcomingTrips: string;
    viewTheTripCta: string;
    earlierTravelling: string;
    pastTripsTitle: string;
    viewPastTrips: string;
    theTrip: string;
    fromCountry: string;
    toCountry: string;
    throughCountry: string;
    routeLine1: string;
    routeLine2: string;
    routeFallback: string;
    publicTrip: string;
    oneCountry: string;
    nCountries: string;
    routeBlurbThrough: string;
    routeBlurbIn: string;
    routeBlurbSuffix: string;
    routeBlurbDefault: string;
    viewRoute: string;
    footerTagline: string;
    and: string;
  };
  trips: {
    archiveEyebrow: string;
    listEyebrow: string;
    archiveTitle: string;
    listTitle: string;
    intro: string;
    story: string;
    stories: string;
    empty: string;
  };
  trip: {
    ourTrip: string;
    allTrips: string;
    routeMapAria: string;
    route: string;
    onTheMap: string;
    fullMap: string;
    mapComing: string;
    viewRoute: string;
    journal: string;
    allStories: string;
    noStoriesYet: string;
    dayN: string;
    dayReport: string;
    onTheWay: string;
    storiesEmpty: string;
    followOnPolarsteps: string;
  };
  route: {
    backToTrip: string;
    route: string;
    intro: string;
    legendAria: string;
    planned: string;
    planning: string;
    visitedPublished: string;
    storiesInOrder: string;
    dayN: string;
    onTheWay: string;
    travelStory: string;
    listEmpty: string;
  };
  photos: {
    backToTrip: string;
    photos: string;
    dayN: string;
    photoAlt: string;
    onTheWay: string;
    empty: string;
  };
  day: {
    allStories: string;
    dayNDate: string;
    travelStory: string;
    photoAlt: string;
    onTheWay: string;
    previousDay: string;
    nextDay: string;
    followOnPolarsteps: string;
  };
  about: {
    eyebrow: string;
    title: string;
    intro: string;
    later: string;
  };
  map: {
    loading: string;
    routeToggleTitle: string;
    routeToggleAria: string;
    routeToggleLabel: string;
    open: string;
    ariaLabel: string;
    empty: string;
    publishedDay: string;
    plannedDay: string;
    visitedDay: string;
    accommodation: string;
    activity: string;
    transport: string;
    flight: string;
    permit: string;
  };
};

export const dictionaries: Record<Locale, PublicDictionary> = {
  nl: {
    meta: {
      description: "Onze reizen, verhalen en foto’s.",
    },
    header: {
      wordmark: "Op reis",
      stories: "Verhalen",
      trips: "Reizen",
      about: "Over ons",
      myTrip: "Mijn reis",
      language: "Taal",
    },
    home: {
      emptyEyebrow: "Op reis",
      emptyTitle: "Nieuwe verhalen volgen binnenkort.",
      travelling: "Nu onderweg",
      departingSoon: "Binnenkort vertrekken",
      followDays: "Volg onze dagen",
      nextTrip: "Onze volgende reis",
      storiesAndPhotos: "Verhalen en foto’s",
      followTrip: "Volg deze reis",
      viewTrip: "Bekijk deze reis",
      onTheRoad: "Onderweg",
      tripStories: "Reisverhalen",
      latestStories: "De laatste verhalen",
      storiesWhenTravelling: "Verhalen zodra we onderweg zijn",
      viewTheTrip: "Bekijk de reis",
      dayN: "Dag {n}",
      onTheWay: "Onderweg",
      dayReport: "Dagverslag",
      storiesEmpty: "Zodra we een dag publiceren, lees je hem hier.",
      thenTravelling: "Daarna op reis",
      upcomingTrips: "Komende reizen",
      viewTheTripCta: "Bekijk de reis",
      earlierTravelling: "Eerder op reis",
      pastTripsTitle: "Onze eerdere reizen",
      viewPastTrips: "Bekijk reizen uit het verleden",
      theTrip: "De reis",
      fromCountry: "Van {country}",
      toCountry: "naar {country}.",
      throughCountry: "Door {country}.",
      routeLine1: "De route",
      routeLine2: "op de kaart.",
      routeFallback: "Route",
      publicTrip: "Openbare reis",
      oneCountry: "1 land",
      nCountries: "{n} landen",
      routeBlurbThrough: "Een openbare reis door {countries}",
      routeBlurbIn: "Een openbare reis in {country}",
      routeBlurbSuffix: " — verhalen, foto’s en de route op de kaart.",
      routeBlurbDefault: "Verhalen, foto’s en de route op de kaart.",
      viewRoute: "Bekijk de route",
      footerTagline: "Henk & Michel — plaatsen, verhalen en foto’s die bijblijven.",
      and: " en ",
    },
    trips: {
      archiveEyebrow: "Reisarchief",
      listEyebrow: "Onze reizen",
      archiveTitle: "Reizen uit het verleden",
      listTitle: "Onze reizen",
      intro: "Verhalen en foto’s die we bewust hebben gedeeld.",
      story: "verhaal",
      stories: "verhalen",
      empty: "Er zijn nog geen openbare reizen in deze selectie.",
    },
    trip: {
      ourTrip: "Onze reis",
      allTrips: "← Alle reizen",
      routeMapAria: "Routekaart",
      route: "Route",
      onTheMap: "Op de kaart",
      fullMap: "Volledige kaart",
      mapComing: "Kaart volgt",
      viewRoute: "Bekijk de route",
      journal: "Reisdagboek",
      allStories: "Alle verhalen",
      noStoriesYet: "Nog geen verhalen",
      dayN: "Dag {n}",
      dayReport: "Dagverslag",
      onTheWay: "Onderweg",
      storiesEmpty: "Zodra we een dag publiceren, verschijnt het verhaal hier.",
      followOnPolarsteps: "Je kunt deze reis ook volgen op Polarsteps",
    },
    route: {
      backToTrip: "← Terug naar reis",
      route: "Route",
      intro:
        "Geplande plekken en openbare planningpins (alleen titel + plaats). Gepubliceerde dagen staan op de bezochte plek als die is gezet. Precieze fotolocaties blijven privé.",
      legendAria: "Legenda",
      planned: "Gepland ({n})",
      planning: "Planning ({n})",
      visitedPublished: "Bezocht / gepubliceerd ({n})",
      storiesInOrder: "Verhalen in volgorde",
      dayN: "Dag {n}",
      onTheWay: "Onderweg",
      travelStory: "Reisverhaal",
      listEmpty: "De verhalenlijst verschijnt zodra we dagen publiceren.",
    },
    photos: {
      backToTrip: "← Terug naar reis",
      photos: "Foto’s",
      dayN: "Dag {n}",
      photoAlt: "Foto dag {n} – {place}",
      onTheWay: "onderweg",
      empty: "Er zijn nog geen openbare foto’s.",
    },
    day: {
      allStories: "← Alle verhalen",
      dayNDate: "Dag {n} · {date}",
      travelStory: "Reisverhaal",
      photoAlt: "Foto dag {n} – {place}",
      onTheWay: "onderweg",
      previousDay: "← Vorige dag",
      nextDay: "Volgende dag →",
      followOnPolarsteps: "Je kunt deze reis ook volgen op Polarsteps",
    },
    about: {
      eyebrow: "Over ons",
      title: "Henk & Michel",
      intro: "We delen hier de reizen die bijblijven: rustig, persoonlijk en op ons eigen tempo.",
      later: "Deze tekst vullen we later aan met ons eigen verhaal.",
    },
    map: {
      loading: "Kaart laden…",
      routeToggleTitle: "Lijn langs foto’s met GPS (of geplande dagen)",
      routeToggleAria: "Routelijn tonen",
      routeToggleLabel: "Lijn",
      open: "Openen →",
      ariaLabel: "Reiskaart",
      empty: "Nog geen kaartpunten. Vul een plaats in bij een reisdag of planningonderdeel om een pin te krijgen.",
      publishedDay: "Gepubliceerd · dag {n}",
      plannedDay: "Gepland · dag {n}",
      visitedDay: "Bezocht · dag {n}",
      accommodation: "Verblijf",
      activity: "Activiteit",
      transport: "Vervoer",
      flight: "Vlucht",
      permit: "Visum / permit",
    },
  },
  en: {
    meta: {
      description: "Our trips, stories and photos.",
    },
    header: {
      wordmark: "On the road",
      stories: "Stories",
      trips: "Trips",
      about: "About us",
      myTrip: "My trip",
      language: "Language",
    },
    home: {
      emptyEyebrow: "On the road",
      emptyTitle: "New stories are coming soon.",
      travelling: "On the road now",
      departingSoon: "Leaving soon",
      followDays: "Follow our days",
      nextTrip: "Our next trip",
      storiesAndPhotos: "Stories and photos",
      followTrip: "Follow this trip",
      viewTrip: "View this trip",
      onTheRoad: "On the road",
      tripStories: "Travel stories",
      latestStories: "Latest stories",
      storiesWhenTravelling: "Stories once we are on the road",
      viewTheTrip: "View the trip",
      dayN: "Day {n}",
      onTheWay: "On the way",
      dayReport: "Day journal",
      storiesEmpty: "When we publish a day, you can read it here.",
      thenTravelling: "Next up",
      upcomingTrips: "Upcoming trips",
      viewTheTripCta: "View the trip",
      earlierTravelling: "Earlier trips",
      pastTripsTitle: "Our earlier trips",
      viewPastTrips: "Browse past trips",
      theTrip: "The trip",
      fromCountry: "From {country}",
      toCountry: "to {country}.",
      throughCountry: "Through {country}.",
      routeLine1: "The route",
      routeLine2: "on the map.",
      routeFallback: "Route",
      publicTrip: "Public trip",
      oneCountry: "1 country",
      nCountries: "{n} countries",
      routeBlurbThrough: "A public trip through {countries}",
      routeBlurbIn: "A public trip in {country}",
      routeBlurbSuffix: " — stories, photos and the route on the map.",
      routeBlurbDefault: "Stories, photos and the route on the map.",
      viewRoute: "View the route",
      footerTagline: "Henk & Michel — places, stories and photos that stay with you.",
      and: " and ",
    },
    trips: {
      archiveEyebrow: "Trip archive",
      listEyebrow: "Our trips",
      archiveTitle: "Past trips",
      listTitle: "Our trips",
      intro: "Stories and photos we have chosen to share.",
      story: "story",
      stories: "stories",
      empty: "There are no public trips in this selection yet.",
    },
    trip: {
      ourTrip: "Our trip",
      allTrips: "← All trips",
      routeMapAria: "Route map",
      route: "Route",
      onTheMap: "On the map",
      fullMap: "Full map",
      mapComing: "Map coming soon",
      viewRoute: "View the route",
      journal: "Travel journal",
      allStories: "All stories",
      noStoriesYet: "No stories yet",
      dayN: "Day {n}",
      dayReport: "Day journal",
      onTheWay: "On the way",
      storiesEmpty: "When we publish a day, the story will appear here.",
      followOnPolarsteps: "You can also follow this trip on Polarsteps",
    },
    route: {
      backToTrip: "← Back to trip",
      route: "Route",
      intro:
        "Planned places and public planning pins (title and place only). Published days appear at the visited place when set. Exact photo locations stay private.",
      legendAria: "Legend",
      planned: "Planned ({n})",
      planning: "Planning ({n})",
      visitedPublished: "Visited / published ({n})",
      storiesInOrder: "Stories in order",
      dayN: "Day {n}",
      onTheWay: "On the way",
      travelStory: "Travel story",
      listEmpty: "The story list appears once we publish days.",
    },
    photos: {
      backToTrip: "← Back to trip",
      photos: "Photos",
      dayN: "Day {n}",
      photoAlt: "Photo day {n} – {place}",
      onTheWay: "on the way",
      empty: "There are no public photos yet.",
    },
    day: {
      allStories: "← All stories",
      dayNDate: "Day {n} · {date}",
      travelStory: "Travel story",
      photoAlt: "Photo day {n} – {place}",
      onTheWay: "on the way",
      previousDay: "← Previous day",
      nextDay: "Next day →",
      followOnPolarsteps: "You can also follow this trip on Polarsteps",
    },
    about: {
      eyebrow: "About us",
      title: "Henk & Michel",
      intro: "We share the trips that stay with us: calmly, personally, and at our own pace.",
      later: "We will add our own story here later.",
    },
    map: {
      loading: "Loading map…",
      routeToggleTitle: "Line along GPS photos (or planned days)",
      routeToggleAria: "Show route line",
      routeToggleLabel: "Line",
      open: "Open →",
      ariaLabel: "Trip map",
      empty: "No map points yet. Add a place to a trip day or planning item to get a pin.",
      publishedDay: "Published · day {n}",
      plannedDay: "Planned · day {n}",
      visitedDay: "Visited · day {n}",
      accommodation: "Stay",
      activity: "Activity",
      transport: "Transport",
      flight: "Flight",
      permit: "Visa / permit",
    },
  },
  pt: {
    meta: {
      description: "As nossas viagens, histórias e fotos.",
    },
    header: {
      wordmark: "Em viagem",
      stories: "Histórias",
      trips: "Viagens",
      about: "Sobre nós",
      myTrip: "A minha viagem",
      language: "Idioma",
    },
    home: {
      emptyEyebrow: "Em viagem",
      emptyTitle: "Novas histórias em breve.",
      travelling: "A caminho",
      departingSoon: "Partida em breve",
      followDays: "Siga os nossos dias",
      nextTrip: "A nossa próxima viagem",
      storiesAndPhotos: "Histórias e fotos",
      followTrip: "Seguir esta viagem",
      viewTrip: "Ver esta viagem",
      onTheRoad: "A caminho",
      tripStories: "Histórias de viagem",
      latestStories: "As últimas histórias",
      storiesWhenTravelling: "Histórias quando estivermos a caminho",
      viewTheTrip: "Ver a viagem",
      dayN: "Dia {n}",
      onTheWay: "A caminho",
      dayReport: "Diário do dia",
      storiesEmpty: "Quando publicarmos um dia, pode lê-lo aqui.",
      thenTravelling: "A seguir",
      upcomingTrips: "Próximas viagens",
      viewTheTripCta: "Ver a viagem",
      earlierTravelling: "Viagens anteriores",
      pastTripsTitle: "As nossas viagens anteriores",
      viewPastTrips: "Ver viagens do passado",
      theTrip: "A viagem",
      fromCountry: "De {country}",
      toCountry: "para {country}.",
      throughCountry: "Por {country}.",
      routeLine1: "A rota",
      routeLine2: "no mapa.",
      routeFallback: "Rota",
      publicTrip: "Viagem pública",
      oneCountry: "1 país",
      nCountries: "{n} países",
      routeBlurbThrough: "Uma viagem pública por {countries}",
      routeBlurbIn: "Uma viagem pública em {country}",
      routeBlurbSuffix: " — histórias, fotos e a rota no mapa.",
      routeBlurbDefault: "Histórias, fotos e a rota no mapa.",
      viewRoute: "Ver a rota",
      footerTagline: "Henk & Michel — lugares, histórias e fotos que ficam.",
      and: " e ",
    },
    trips: {
      archiveEyebrow: "Arquivo de viagens",
      listEyebrow: "As nossas viagens",
      archiveTitle: "Viagens do passado",
      listTitle: "As nossas viagens",
      intro: "Histórias e fotos que escolhemos partilhar.",
      story: "história",
      stories: "histórias",
      empty: "Ainda não há viagens públicas nesta seleção.",
    },
    trip: {
      ourTrip: "A nossa viagem",
      allTrips: "← Todas as viagens",
      routeMapAria: "Mapa da rota",
      route: "Rota",
      onTheMap: "No mapa",
      fullMap: "Mapa completo",
      mapComing: "Mapa em breve",
      viewRoute: "Ver a rota",
      journal: "Diário de viagem",
      allStories: "Todas as histórias",
      noStoriesYet: "Ainda sem histórias",
      dayN: "Dia {n}",
      dayReport: "Diário do dia",
      onTheWay: "A caminho",
      storiesEmpty: "Quando publicarmos um dia, a história aparece aqui.",
      followOnPolarsteps: "Também podes seguir esta viagem no Polarsteps",
    },
    route: {
      backToTrip: "← Voltar à viagem",
      route: "Rota",
      intro:
        "Lugares planeados e pins públicos de planeamento (só título e local). Os dias publicados aparecem no local visitado quando definido. As localizações exactas das fotos ficam privadas.",
      legendAria: "Legenda",
      planned: "Planeado ({n})",
      planning: "Planeamento ({n})",
      visitedPublished: "Visitado / publicado ({n})",
      storiesInOrder: "Histórias por ordem",
      dayN: "Dia {n}",
      onTheWay: "A caminho",
      travelStory: "História de viagem",
      listEmpty: "A lista de histórias aparece quando publicarmos dias.",
    },
    photos: {
      backToTrip: "← Voltar à viagem",
      photos: "Fotos",
      dayN: "Dia {n}",
      photoAlt: "Foto dia {n} – {place}",
      onTheWay: "a caminho",
      empty: "Ainda não há fotos públicas.",
    },
    day: {
      allStories: "← Todas as histórias",
      dayNDate: "Dia {n} · {date}",
      travelStory: "História de viagem",
      photoAlt: "Foto dia {n} – {place}",
      onTheWay: "a caminho",
      previousDay: "← Dia anterior",
      nextDay: "Dia seguinte →",
      followOnPolarsteps: "Também podes seguir esta viagem no Polarsteps",
    },
    about: {
      eyebrow: "Sobre nós",
      title: "Henk & Michel",
      intro: "Partilhamos aqui as viagens que ficam connosco: com calma, de forma pessoal e ao nosso ritmo.",
      later: "Mais tarde completamos este texto com a nossa história.",
    },
    map: {
      loading: "A carregar o mapa…",
      routeToggleTitle: "Linha pelas fotos com GPS (ou dias planeados)",
      routeToggleAria: "Mostrar linha da rota",
      routeToggleLabel: "Linha",
      open: "Abrir →",
      ariaLabel: "Mapa da viagem",
      empty: "Ainda sem pontos no mapa. Indique um lugar num dia de viagem ou item de planeamento para obter um pin.",
      publishedDay: "Publicado · dia {n}",
      plannedDay: "Planeado · dia {n}",
      visitedDay: "Visitado · dia {n}",
      accommodation: "Estadia",
      activity: "Atividade",
      transport: "Transporte",
      flight: "Voo",
      permit: "Visto / autorização",
    },
  },
};

export function getDictionary(locale: Locale): PublicDictionary {
  return dictionaries[locale];
}

export function t(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
