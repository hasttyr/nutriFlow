// Names and addresses are captured and written in each country's own order (profile data):
// Japan puts the family name first and goes from prefecture down to the building.

export const nameFields = (profile) => (profile.nameOrder === 'family-given' ? ['familyName', 'givenName'] : ['givenName', 'familyName']);

export const formatName = (person, profile) => nameFields(profile).map((field) => person[field]).filter(Boolean).join(' ');

export const formatAddress = (address, profile) =>
  profile.address.fields
    .map((field) => (field === 'postalCode' && address[field] ? `${profile.postalCode.prefix ?? ''}${address[field]}` : address[field]))
    .filter(Boolean)
    .join(', ');
