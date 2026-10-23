import type { Schema, Struct } from '@strapi/strapi';

export interface AdresseAdresse extends Struct.ComponentSchema {
  collectionName: 'components_adresse_adresses';
  info: {
    displayName: 'Adresse';
    icon: 'pinMap';
  };
  attributes: {
    city: Schema.Attribute.String;
    street: Schema.Attribute.String;
  };
}

export interface AnschriftAnschrift extends Struct.ComponentSchema {
  collectionName: 'components_anschrift_anschrifts';
  info: {
    displayName: 'Anschrift';
    icon: 'pinMap';
  };
  attributes: {
    address: Schema.Attribute.Component<'adresse.adresse', false>;
    email: Schema.Attribute.Email;
    mobile: Schema.Attribute.String;
    name: Schema.Attribute.String;
    phone: Schema.Attribute.String;
  };
}

export interface FarbeFarbe extends Struct.ComponentSchema {
  collectionName: 'components_farbe_farbes';
  info: {
    displayName: 'Farbe';
    icon: 'paintBrush';
  };
  attributes: {
    hex: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String;
  };
}

export interface KlassengruppeKlassengruppe extends Struct.ComponentSchema {
  collectionName: 'components_klassengruppe_klassengruppes';
  info: {
    description: 'Eine Klasse pro Zeile, "---" als Trenner';
    displayName: 'Klassengruppe';
    icon: 'bulletList';
  };
  attributes: {
    classes: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'adresse.adresse': AdresseAdresse;
      'anschrift.anschrift': AnschriftAnschrift;
      'farbe.farbe': FarbeFarbe;
      'klassengruppe.klassengruppe': KlassengruppeKlassengruppe;
    }
  }
}
