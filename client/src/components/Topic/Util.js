/* eslint-disable import/prefer-default-export */
export const getArbitratorNamesFromAddress = ({ selectedAddresses, allAddresses, allNames }) => {
  const selectedNames = [];
  selectedAddresses.forEach((_address) => {
    const index = allAddresses.findIndex((n) => (n === _address));
    selectedNames.push(allNames[index]);
  });
  return selectedNames;
};


export const formatDate = (date) => {
  return date.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}