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

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'adresse.adresse': AdresseAdresse;
      'anschrift.anschrift': AnschriftAnschrift;
    }
  }
}
