class PromptBuilder {
  static buildItineraryPrompt(destination, days, budget, preferences) {
    // Implementation for building itinerary generation prompts
    return `Create a detailed travel itinerary for ${destination}...`;
  }

  static buildChatPrompt(userMessage, context) {
    // Implementation for building chat prompts
    return `User says: ${userMessage}. Context: ${context}...`;
  }

  static buildUpdatePrompt(currentItinerary, updateRequest) {
    // Implementation for building update prompts
    return `Current itinerary: ${currentItinerary}. Update request: ${updateRequest}...`;
  }
}

module.exports = PromptBuilder;
